const crypto = require('node:crypto');
const { initializeApp } = require('firebase-admin/app');
const { FieldValue, Timestamp, getFirestore } = require('firebase-admin/firestore');
const { defineSecret } = require('firebase-functions/params');
const { HttpsError, onCall } = require('firebase-functions/v2/https');

initializeApp();

const db = getFirestore();
const recoverySecret = defineSecret('SECRET_CALENDAR_RECOVERY_KEY');
const OTP_LIFETIME_MS = 10 * 60 * 1000;
const RESEND_DELAY_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const getRecoveryKey = () => {
  const key = Buffer.from(recoverySecret.value(), 'base64');
  if (key.length !== 32) {
    throw new HttpsError('failed-precondition', 'Secret calendar recovery is not configured.');
  }
  return key;
};

const requireVerifiedUser = (request) => {
  const uid = request.auth?.uid;
  const email = request.auth?.token.email;
  if (!uid || !email || request.auth.token.email_verified !== true) {
    throw new HttpsError('unauthenticated', 'A signed-in account with a verified email is required.');
  }
  return { uid, email };
};

const recoveryDocument = (uid) => db.doc(`users/${uid}/meta/secretCalendarRecovery`);
const otpDocument = (uid) => db.doc(`users/${uid}/secretCalendarRecovery/otp`);

const hashCode = (uid, salt, code) => crypto
  .createHmac('sha256', getRecoveryKey())
  .update(`${uid}:${salt}:${code}`)
  .digest();

const encryptVaultKey = (vaultKey) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getRecoveryKey(), iv);
  const encrypted = Buffer.concat([cipher.update(vaultKey), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
};

const decryptVaultKey = (value) => {
  const payload = Buffer.from(value, 'base64');
  if (payload.length < 29) throw new HttpsError('internal', 'The recovery key is invalid.');
  const iv = payload.subarray(0, 12);
  const authTag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', getRecoveryKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('base64');
};

exports.storeSecretCalendarRecoveryKey = onCall(
  { secrets: [recoverySecret] },
  async (request) => {
    const { uid } = requireVerifiedUser(request);
    const value = request.data?.vaultKey;
    if (typeof value !== 'string' || Buffer.from(value, 'base64').length !== 32) {
      throw new HttpsError('invalid-argument', 'The recovery key is invalid.');
    }

    await recoveryDocument(uid).set({
      wrappedVaultKey: encryptVaultKey(Buffer.from(value, 'base64')),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
);

exports.requestSecretCalendarRecoveryCode = onCall(
  { secrets: [recoverySecret] },
  async (request) => {
    const { uid, email } = requireVerifiedUser(request);
    const recoverySnapshot = await recoveryDocument(uid).get();
    if (!recoverySnapshot.exists) {
      throw new HttpsError('failed-precondition', 'The private calendar has not been configured.');
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const codeHash = hashCode(uid, salt, code).toString('hex');
    const now = Date.now();
    const otpRef = otpDocument(uid);
    const mailRef = db.collection('mail').doc();

    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(otpRef);
      const lastSentAt = current.exists ? current.data().lastSentAt?.toMillis() : undefined;
      if (typeof lastSentAt === 'number' && now - lastSentAt < RESEND_DELAY_MS) {
        throw new HttpsError('resource-exhausted', 'Please wait before requesting another recovery code.');
      }

      transaction.set(otpRef, {
        codeHash,
        salt,
        attempts: 0,
        expiresAt: Timestamp.fromMillis(now + OTP_LIFETIME_MS),
        lastSentAt: Timestamp.fromMillis(now),
      });
      transaction.set(mailRef, {
        to: email,
        message: {
          subject: 'Task2Goal private calendar recovery code',
          text: `Your Task2Goal recovery code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
        },
      });
    });
  }
);

exports.verifySecretCalendarRecoveryCode = onCall(
  { secrets: [recoverySecret] },
  async (request) => {
    const { uid } = requireVerifiedUser(request);
    const code = request.data?.code;
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      throw new HttpsError('invalid-argument', 'Enter the six-digit recovery code.');
    }

    const keyRef = recoveryDocument(uid);
    const otpRef = otpDocument(uid);
    const outcome = await db.runTransaction(async (transaction) => {
      const [otpSnapshot, keySnapshot] = await Promise.all([
        transaction.get(otpRef),
        transaction.get(keyRef),
      ]);
      if (!otpSnapshot.exists || !keySnapshot.exists) {
        return { error: 'missing' };
      }

      const otp = otpSnapshot.data();
      if (otp.expiresAt.toMillis() <= Date.now()) {
        transaction.delete(otpRef);
        return { error: 'expired' };
      }
      if (otp.attempts >= MAX_ATTEMPTS) {
        transaction.delete(otpRef);
        return { error: 'attempts' };
      }

      const submittedHash = hashCode(uid, otp.salt, code);
      const savedHash = Buffer.from(otp.codeHash, 'hex');
      if (submittedHash.length !== savedHash.length || !crypto.timingSafeEqual(submittedHash, savedHash)) {
        transaction.update(otpRef, { attempts: FieldValue.increment(1) });
        return { error: 'incorrect' };
      }

      transaction.delete(otpRef);
      return { wrappedVaultKey: keySnapshot.data().wrappedVaultKey };
    });

    if ('error' in outcome) {
      const failures = {
        missing: ['failed-precondition', 'Request a new recovery code.'],
        expired: ['deadline-exceeded', 'The recovery code has expired.'],
        attempts: ['resource-exhausted', 'Too many incorrect attempts. Request a new code.'],
        incorrect: ['permission-denied', 'The recovery code is incorrect.'],
      };
      const [codeName, message] = failures[outcome.error] || failures.missing;
      throw new HttpsError(codeName, message);
    }

    try {
      return { vaultKey: decryptVaultKey(outcome.wrappedVaultKey) };
    } catch (error) {
      console.error('Unable to unwrap the secret calendar recovery key:', error);
      throw new HttpsError('internal', 'The private calendar recovery failed.');
    }
  }
);
