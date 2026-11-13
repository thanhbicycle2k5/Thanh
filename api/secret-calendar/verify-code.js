const crypto = require('node:crypto');
const {
  ApiError,
  FieldValue,
  MAX_ATTEMPTS,
  decryptVaultKey,
  getDb,
  hashCode,
  otpRef,
  parseBody,
  recoveryRef,
  requireMethod,
  requireVerifiedUser,
  sendError,
} = require('./_shared');

module.exports = async function handler(request, response) {
  try {
    requireMethod(request, 'POST');
    const { uid } = await requireVerifiedUser(request);
    const code = parseBody(request).code;
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      throw new ApiError(400, 'request/invalid-code', 'Enter the six-digit recovery code.');
    }

    const db = getDb();
    const codeRef = otpRef(uid);
    const keyRef = recoveryRef(uid);
    const result = await db.runTransaction(async (transaction) => {
      const [codeSnapshot, keySnapshot] = await Promise.all([
        transaction.get(codeRef),
        transaction.get(keyRef),
      ]);
      if (!codeSnapshot.exists || !keySnapshot.exists) return { error: 'missing' };

      const saved = codeSnapshot.data();
      if (saved.expiresAt.toMillis() <= Date.now()) {
        transaction.delete(codeRef);
        return { error: 'expired' };
      }
      if (saved.attempts >= MAX_ATTEMPTS) {
        transaction.delete(codeRef);
        return { error: 'attempts' };
      }

      const submittedHash = hashCode(uid, saved.salt, code);
      const savedHash = Buffer.from(saved.codeHash, 'hex');
      if (submittedHash.length !== savedHash.length || !crypto.timingSafeEqual(submittedHash, savedHash)) {
        transaction.update(codeRef, { attempts: FieldValue.increment(1) });
        return { error: 'incorrect' };
      }

      transaction.delete(codeRef);
      return { wrappedVaultKey: keySnapshot.data().wrappedVaultKey };
    });

    if ('error' in result) {
      const errors = {
        missing: [412, 'functions/failed-precondition', 'Request a recovery code first.'],
        expired: [410, 'functions/deadline-exceeded', 'The recovery code has expired.'],
        attempts: [429, 'functions/resource-exhausted', 'Too many incorrect attempts. Request a new code.'],
        incorrect: [403, 'functions/permission-denied', 'The recovery code is incorrect.'],
      };
      const [status, errorCode, message] = errors[result.error] || errors.missing;
      throw new ApiError(status, errorCode, message);
    }

    return response.status(200).json({ vaultKey: decryptVaultKey(result.wrappedVaultKey) });
  } catch (error) {
    return sendError(response, error);
  }
};
