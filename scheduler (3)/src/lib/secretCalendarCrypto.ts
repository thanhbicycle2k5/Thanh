import type { Plan } from '../types';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface SecretCalendarVault {
  version: 1;
  keySalt: string;
  keyIv: string;
  wrappedKey: string;
  dataIv: string;
  encryptedData: string;
}

export const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
};

export const base64ToBytes = (value: string): Uint8Array => {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const deriveWrappingKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 310_000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const createSecretCalendarVault = async (password: string): Promise<{
  vault: SecretCalendarVault;
  vaultKey: Uint8Array;
}> => {
  const vaultKey = crypto.getRandomValues(new Uint8Array(32));
  const keySalt = crypto.getRandomValues(new Uint8Array(16));
  const keyIv = crypto.getRandomValues(new Uint8Array(12));
  const wrappingKey = await deriveWrappingKey(password, keySalt);
  const wrappedKey = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: keyIv }, wrappingKey, vaultKey);
  const dataIv = crypto.getRandomValues(new Uint8Array(12));
  const dataKey = await crypto.subtle.importKey('raw', vaultKey, 'AES-GCM', false, ['encrypt']);
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: dataIv },
    dataKey,
    encoder.encode('[]')
  );

  return {
    vault: {
      version: 1,
      keySalt: bytesToBase64(keySalt),
      keyIv: bytesToBase64(keyIv),
      wrappedKey: bytesToBase64(new Uint8Array(wrappedKey)),
      dataIv: bytesToBase64(dataIv),
      encryptedData: bytesToBase64(new Uint8Array(encryptedData)),
    },
    vaultKey,
  };
};

export const decryptSecretCalendarPlans = async (
  vault: SecretCalendarVault,
  vaultKey: Uint8Array
): Promise<Plan[]> => {
  const dataKey = await crypto.subtle.importKey('raw', vaultKey, 'AES-GCM', false, ['decrypt']);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(vault.dataIv) },
    dataKey,
    base64ToBytes(vault.encryptedData)
  );
  const plans: unknown = JSON.parse(decoder.decode(plaintext));
  if (!Array.isArray(plans)) throw new Error('Secret calendar data is invalid.');
  return plans as Plan[];
};

export const unlockSecretCalendarVault = async (
  vault: SecretCalendarVault,
  password: string
): Promise<{ vaultKey: Uint8Array; plans: Plan[] }> => {
  const wrappingKey = await deriveWrappingKey(password, base64ToBytes(vault.keySalt));
  const rawVaultKey = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(vault.keyIv) },
    wrappingKey,
    base64ToBytes(vault.wrappedKey)
  );
  const vaultKey = new Uint8Array(rawVaultKey);
  return { vaultKey, plans: await decryptSecretCalendarPlans(vault, vaultKey) };
};

export const encryptSecretCalendarPlans = async (
  vault: SecretCalendarVault,
  vaultKey: Uint8Array,
  plans: Plan[]
): Promise<SecretCalendarVault> => {
  const dataIv = crypto.getRandomValues(new Uint8Array(12));
  const dataKey = await crypto.subtle.importKey('raw', vaultKey, 'AES-GCM', false, ['encrypt']);
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: dataIv },
    dataKey,
    encoder.encode(JSON.stringify(plans))
  );
  return { ...vault, dataIv: bytesToBase64(dataIv), encryptedData: bytesToBase64(new Uint8Array(encryptedData)) };
};

export const rewrapSecretCalendarKey = async (
  vault: SecretCalendarVault,
  vaultKey: Uint8Array,
  newPassword: string
): Promise<SecretCalendarVault> => {
  const keySalt = crypto.getRandomValues(new Uint8Array(16));
  const keyIv = crypto.getRandomValues(new Uint8Array(12));
  const wrappingKey = await deriveWrappingKey(newPassword, keySalt);
  const wrappedKey = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: keyIv }, wrappingKey, vaultKey);
  return {
    ...vault,
    keySalt: bytesToBase64(keySalt),
    keyIv: bytesToBase64(keyIv),
    wrappedKey: bytesToBase64(new Uint8Array(wrappedKey)),
  };
};
