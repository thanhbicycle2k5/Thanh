import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
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
const FUNCTIONS_REGION = 'us-central1';
const toBase64 = bytesToBase64;
const fromBase64 = base64ToBytes;

const localKey = (uid: string) => `${LOCAL_VAULT_KEY}_${uid}`;

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

const functions = getFunctions(auth.app, FUNCTIONS_REGION);
const saveRecoveryKeyCall = httpsCallable<{ vaultKey: string }, void>(functions, 'storeSecretCalendarRecoveryKey');
const requestRecoveryCodeCall = httpsCallable<Record<string, never>, void>(functions, 'requestSecretCalendarRecoveryCode');
const verifyRecoveryCodeCall = httpsCallable<{ code: string }, { vaultKey: string }>(functions, 'verifySecretCalendarRecoveryCode');

export const storeSecretCalendarRecoveryKey = async (vaultKey: Uint8Array): Promise<void> => {
  await saveRecoveryKeyCall({ vaultKey: toBase64(vaultKey) });
};

export const requestSecretCalendarRecoveryCode = async (): Promise<void> => {
  await requestRecoveryCodeCall({});
};

export const verifySecretCalendarRecoveryCode = async (code: string): Promise<Uint8Array> => {
  const result = await verifyRecoveryCodeCall({ code });
  return fromBase64(result.data.vaultKey);
};
