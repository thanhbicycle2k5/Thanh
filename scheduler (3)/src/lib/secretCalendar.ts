import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  base64ToBytes,
  bytesToBase64,
  SecretCalendarVault,
} from './secretCalendarCrypto';

export {
  createSecretCalendarVault,
  decryptSecretCalendarPlans,
  encryptSecretCalendarPlans,
  rewrapSecretCalendarKey,
  unlockSecretCalendarVault,
} from './secretCalendarCrypto';
export type { SecretCalendarVault } from './secretCalendarCrypto';

const LOCAL_VAULT_KEY = 'task2goal_secret_calendar_v1';
const toBase64 = bytesToBase64;
const fromBase64 = base64ToBytes;

const localKey = (uid: string) => `${LOCAL_VAULT_KEY}_${uid}`;

interface SecretCalendarApiError {
  code?: unknown;
  error?: unknown;
}

const callSecretCalendarApi = async <T>(endpoint: string, body: Record<string, string>): Promise<T> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw Object.assign(new Error('Sign-in is required.'), { code: 'auth/unauthenticated' });
  }
  const idToken = await currentUser.getIdToken();
  const response = await fetch(`/api/secret-calendar/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const apiError = payload && typeof payload === 'object' ? payload as SecretCalendarApiError : {};
    const code = typeof apiError.code === 'string'
      ? apiError.code
      : response.status === 404 ? 'api/not-found' : 'api/unavailable';
    const message = typeof apiError.error === 'string' ? apiError.error : 'The recovery API is unavailable.';
    throw Object.assign(new Error(message), { code });
  }
  return payload as T;
};

export const loadSecretCalendarVault = async (uid: string): Promise<SecretCalendarVault | null> => {
  const localVault = localStorage.getItem(localKey(uid));
  try {
    const snapshot = await getDoc(doc(db, 'users', uid, 'secretCalendar', 'vault'));
    if (snapshot.exists()) return snapshot.data() as SecretCalendarVault;
    return localVault ? JSON.parse(localVault) as SecretCalendarVault : null;
  } catch (error) {
    if (localVault) return JSON.parse(localVault) as SecretCalendarVault;
    throw error;
  }
};

export const saveSecretCalendarVault = async (uid: string, vault: SecretCalendarVault): Promise<void> => {
  localStorage.setItem(localKey(uid), JSON.stringify(vault));
  await setDoc(doc(db, 'users', uid, 'secretCalendar', 'vault'), vault);
};

export const storeSecretCalendarRecoveryKey = async (vaultKey: Uint8Array): Promise<void> => {
  await callSecretCalendarApi('store-key', { vaultKey: toBase64(vaultKey) });
};

export const requestSecretCalendarRecoveryCode = async (): Promise<void> => {
  await callSecretCalendarApi('request-code', {});
};

export const verifySecretCalendarRecoveryCode = async (code: string): Promise<Uint8Array> => {
  const result = await callSecretCalendarApi<{ vaultKey: string }>('verify-code', { code });
  return fromBase64(result.vaultKey);
};
