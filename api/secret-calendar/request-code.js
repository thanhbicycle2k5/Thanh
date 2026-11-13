const crypto = require('node:crypto');
const {
  ApiError,
  FieldValue,
  Timestamp,
  OTP_LIFETIME_MS,
  RESEND_DELAY_MS,
  getDb,
  hashCode,
  otpRef,
  parseBody,
  recoveryRef,
  requireMethod,
  requireVerifiedUser,
  sendError,
  sendRecoveryEmail,
} = require('./_shared');

module.exports = async function handler(request, response) {
  try {
    requireMethod(request, 'POST');
    const { uid, email } = await requireVerifiedUser(request);
    parseBody(request);
    const recoverySnapshot = await recoveryRef(uid).get();
    if (!recoverySnapshot.exists) {
      throw new ApiError(412, 'functions/failed-precondition', 'The private calendar is not configured.');
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const codeHash = hashCode(uid, salt, code).toString('hex');
    const ref = otpRef(uid);
    const now = Date.now();

    await getDb().runTransaction(async (transaction) => {
      const current = await transaction.get(ref);
      const lastSentAt = current.exists ? current.data().lastSentAt?.toMillis() : undefined;
      if (typeof lastSentAt === 'number' && now - lastSentAt < RESEND_DELAY_MS) {
        throw new ApiError(429, 'functions/resource-exhausted', 'Please wait before requesting another code.');
      }
      transaction.set(ref, {
        codeHash,
        salt,
        attempts: 0,
        expiresAt: Timestamp.fromMillis(now + OTP_LIFETIME_MS),
        lastSentAt: Timestamp.fromMillis(now),
      });
    });

    try {
      await sendRecoveryEmail(email, code);
    } catch (mailError) {
      await getDb().runTransaction(async (transaction) => {
        const current = await transaction.get(ref);
        if (current.exists && current.data().salt === salt) transaction.delete(ref);
      });
      throw mailError;
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    return sendError(response, error);
  }
};
