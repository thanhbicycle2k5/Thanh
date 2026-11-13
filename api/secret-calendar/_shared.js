const crypto = require('node:crypto');
const nodemailer = require('nodemailer');
const { Timestamp, FieldValue } = require('firebase-admin/firestore');
const { getDb, getFirebaseAuth } = require('../_push');

const OTP_LIFETIME_MS = 10 * 60 * 1000;
const RESEND_DELAY_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function requireMethod(request, method) {
  if (request.method !== method) {
    throw new ApiError(405, 'method/not-allowed', 'Method not allowed.');
  }
}

async function requireVerifiedUser(request) {
  const authorization = String(request.headers.authorization || '');
  const token = authorization.match(/^Bearer ([A-Za-z0-9._-]+)$/)?.[1];
  if (!token) throw new ApiError(401, 'auth/unauthenticated', 'Sign-in is required.');

  let decoded;
  try {
    decoded = await getFirebaseAuth().verifyIdToken(token);
  } catch {
    throw new ApiError(401, 'auth/unauthenticated', 'The sign-in session is invalid or expired.');
  }
  if (!decoded.uid || !decoded.email || decoded.email_verified !== true) {
    throw new ApiError(401, 'auth/unauthenticated', 'A verified sign-in email is required.');
  }
  return { uid: decoded.uid, email: decoded.email };
}

function parseBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') {
    try {
      return JSON.parse(request.body);
    } catch {
      throw new ApiError(400, 'request/invalid-body', 'Invalid request body.');
    }
  }
  return {};
}

function recoveryRef(uid) {
  return getDb().doc(`users/${uid}/meta/secretCalendarRecovery`);
}

function otpRef(uid) {
  return getDb().doc(`users/${uid}/secretCalendarRecovery/otp`);
}

function getRecoveryKey() {
  const encoded = String(process.env.SECRET_CALENDAR_RECOVERY_KEY || '').trim();
  const key = Buffer.from(encoded, 'base64');
  if (!encoded || key.length !== 32 || key.toString('base64') !== encoded) {
    throw new ApiError(503, 'secret/recovery-key-not-configured', 'The recovery key is not configured.');
  }
  return key;
}

function hashCode(uid, salt, code) {
  return crypto.createHmac('sha256', getRecoveryKey()).update(`${uid}:${salt}:${code}`).digest();
}

function encryptVaultKey(vaultKey) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getRecoveryKey(), iv);
  const encrypted = Buffer.concat([cipher.update(vaultKey), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
}

function decryptVaultKey(value) {
  const payload = Buffer.from(value, 'base64');
  if (payload.length < 29) throw new Error('Invalid recovery key envelope.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getRecoveryKey(), payload.subarray(0, 12));
  decipher.setAuthTag(payload.subarray(12, 28));
  return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString('base64');
}

function createMailer() {
  const host = String(process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = String(process.env.SMTP_USER || '').trim();
  const password = String(process.env.SMTP_PASSWORD || '');
  const from = String(process.env.SMTP_FROM || '').trim();
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !user || !password || !from) {
    throw new ApiError(503, 'email/not-configured', 'SMTP environment variables are not configured.');
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
    tls: { minVersion: 'TLSv1.2' },
  });
}

async function sendRecoveryEmail(email, code) {
  let mailer;
  try {
    mailer = createMailer();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(503, 'email/not-configured', 'SMTP environment variables are not configured.');
  }

  try {
    await mailer.sendMail({
      from: String(process.env.SMTP_FROM).trim(),
      to: email,
      subject: 'Task2Goal private calendar recovery code',
      text: `Your Task2Goal recovery code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
    });
  } catch (error) {
    console.error('Unable to send private-calendar recovery email:', {
      code: error?.code,
      responseCode: error?.responseCode,
    });
    throw new ApiError(502, 'email/send-failed', 'The recovery email could not be sent.');
  }
}

function sendError(response, error) {
  if (error instanceof ApiError) {
    return response.status(error.status).json({ code: error.code, error: error.message });
  }
  console.error('Secret calendar API error:', {
    name: error?.name,
    code: error?.code,
    message: error?.message,
  });
  return response.status(500).json({ code: 'internal/error', error: 'The request could not be completed.' });
}

module.exports = {
  ApiError,
  FieldValue,
  Timestamp,
  MAX_ATTEMPTS,
  OTP_LIFETIME_MS,
  RESEND_DELAY_MS,
  decryptVaultKey,
  encryptVaultKey,
  getDb,
  getRecoveryKey,
  hashCode,
  otpRef,
  parseBody,
  recoveryRef,
  requireMethod,
  requireVerifiedUser,
  sendError,
  sendRecoveryEmail,
};
