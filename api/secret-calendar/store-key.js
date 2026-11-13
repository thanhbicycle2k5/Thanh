const {
  ApiError,
  FieldValue,
  parseBody,
  recoveryRef,
  requireMethod,
  requireVerifiedUser,
  encryptVaultKey,
  sendError,
} = require('./_shared');

module.exports = async function handler(request, response) {
  try {
    requireMethod(request, 'POST');
    const { uid } = await requireVerifiedUser(request);
    const vaultKey = parseBody(request).vaultKey;
    if (typeof vaultKey !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(vaultKey)) {
      throw new ApiError(400, 'request/invalid-key', 'The recovery key is invalid.');
    }
    const decodedKey = Buffer.from(vaultKey, 'base64');
    if (decodedKey.length !== 32 || decodedKey.toString('base64') !== vaultKey) {
      throw new ApiError(400, 'request/invalid-key', 'The recovery key is invalid.');
    }

    await recoveryRef(uid).set({
      wrappedVaultKey: encryptVaultKey(decodedKey),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return response.status(200).json({ ok: true });
  } catch (error) {
    return sendError(response, error);
  }
};
