import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  writeBatch,
  onSnapshot,
} from "firebase/firestore";
import { Plan, AppSettings } from "../types";
const firebaseConfig = {
  apiKey: "AIzaSyAI2wBxUR9V5OHr1fVNHJbNv0ReUqxjOww",
  authDomain: "wadebicycle.firebaseapp.com",
  projectId: "wadebicycle",
  storageBucket: "wadebicycle.firebasestorage.app",
  messagingSenderId: "365678601546",
  appId: "1:365678601546:web:40c042ab0961b693ec0db3",
  measurementId: "G-66ZD4J6QX3"
};

const isNewApp = getApps().length === 0;
const app = isNewApp ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Initialize Firestore database
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();
provider.addScope("profile");
provider.addScope("email");
provider.setCustomParameters({ prompt: "select_account" });

let isSigningIn = false;

export const signInWithGoogle = async (): Promise<void> => {
  if (isSigningIn) {
    console.log("Sign-in already in progress...");
    return;
  }
  isSigningIn = true;
  
  try {
    // Some browsers block popups if there's any delay.
    // We call it immediately.
    const result = await signInWithPopup(auth, provider);
    console.log("Sign-in successful", result.user.email);
  } catch (error: any) {
    const code = error?.code;
    const message = error?.message;
    console.error("Authentication Error:", code, message);
    
    // Handle cancelled/multi-request errors silently or with a log
    if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') {
      console.log("User closed the popup or request was cancelled.");
      return;
    }

    if (code === 'auth/popup-blocked') {
      console.warn("Popup blocked. Trying redirect as fallback.");
      try {
        await signInWithRedirect(auth, provider);
      } catch (redirectError) {
        console.error("Redirect auth failed too:", redirectError);
        throw new Error("Popup blocked and redirect failed. Please enable popups for this site.");
      }
      return;
    }

    if (code === 'auth/unauthorized-domain') {
      const currentDomain = window.location.hostname;
      const errorMsg = `Domain ${currentDomain} is not authorized in Firebase Console. Please add it to Authentication > Settings > Authorized domains.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Provide a generic but helpful message for other errors
    throw new Error(`Login failed: ${message || 'Unknown error'}`);
  } finally {
    isSigningIn = false;
  }
};

export const settleRedirectAuth = () => getRedirectResult(auth);

export const signOutUser = () => signOut(auth);
export const clearAuthState = async () => {
  await signOut(auth).catch(() => {});
};
export const onAuthChanged = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  const errorJson = JSON.stringify(errInfo);
  console.error('Firestore Error: ', errorJson);
  throw new Error(errorJson);
}

export const cloudStorage = {
  getPlans: async (uid: string): Promise<Plan[]> => {
    const path = `users/${uid}/plans`;
    try {
      const plansCol = collection(db, "users", uid, "plans");
      const snapshot = await getDocs(plansCol);
      return snapshot.docs.map((d) => d.data() as Plan);
    } catch (e) {
      return handleFirestoreError(e, OperationType.GET, path);
    }
  },

  savePlan: async (uid: string, plan: Plan): Promise<void> => {
    const path = `users/${uid}/plans/${plan.id}`;
    const planRef = doc(db, "users", uid, "plans", plan.id);
    const cleanPlan = { ...plan, notes: plan.notes || undefined };
    if (cleanPlan.notes === undefined) delete cleanPlan.notes;
    
    try {
      await setDoc(planRef, cleanPlan);
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  savePlans: async (uid: string, plans: Plan[]): Promise<void> => {
    const batch = writeBatch(db);
    plans.forEach((plan) => {
      const planRef = doc(db, "users", uid, "plans", plan.id);
      batch.set(planRef, plan);
    });
    try {
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${uid}/plans`);
    }
  },

  deletePlan: async (uid: string, planId: string): Promise<void> => {
    const path = `users/${uid}/plans/${planId}`;
    try {
      const planRef = doc(db, "users", uid, "plans", planId);
      await deleteDoc(planRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  deleteAllPlans: async (uid: string): Promise<void> => {
    const path = `users/${uid}/plans`;
    try {
      const plansCol = collection(db, "users", uid, "plans");
      const snapshot = await getDocs(plansCol);
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  getWeekMetas: async (uid: string): Promise<Record<string, any>> => {
    const path = `users/${uid}/meta/weekMetas`;
    try {
      const ref = doc(db, "users", uid, "meta", "weekMetas");
      const snap = await getDoc(ref);
      return snap.exists() ? snap.data() : {};
    } catch (e) {
      return handleFirestoreError(e, OperationType.GET, path);
    }
  },

  saveWeekMeta: async (uid: string, weekStart: string, meta: any): Promise<void> => {
    const path = `users/${uid}/meta/weekMetas`;
    try {
      const ref = doc(db, "users", uid, "meta", "weekMetas");
      const existing = await cloudStorage.getWeekMetas(uid);
      await setDoc(ref, { ...existing, [weekStart]: { ...existing[weekStart], ...meta } });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  getSettings: async (uid: string): Promise<Partial<AppSettings>> => {
    const path = `users/${uid}/meta/settings`;
    try {
      const ref = doc(db, "users", uid, "meta", "settings");
      const snap = await getDoc(ref);
      return snap.exists() ? (snap.data() as Partial<AppSettings>) : {};
    } catch (e) {
      return handleFirestoreError(e, OperationType.GET, path);
    }
  },

  saveSettings: async (uid: string, settings: Partial<AppSettings>): Promise<void> => {
    const path = `users/${uid}/meta/settings`;
    try {
      const ref = doc(db, "users", uid, "meta", "settings");
      const existing = await cloudStorage.getSettings(uid);
      await setDoc(ref, { ...existing, ...settings });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },
};

export const subscribePlans = (
  uid: string,
  callback: (plans: Plan[]) => void,
  onError?: (e: Error) => void
): (() => void) => {
  const path = `users/${uid}/plans`;
  const plansCol = collection(db, "users", uid, "plans");
  return onSnapshot(
    plansCol,
    (snapshot) => {
      const plans = snapshot.docs.map((d) => d.data() as Plan);
      callback(plans);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};
