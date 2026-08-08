import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
let _authInstance: ReturnType<typeof getAuth> | null = null;
export function getFirebaseAuth() {
  if (!_authInstance) {
    _authInstance = getAuth(app);
  }
  return _authInstance;
}

export const auth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_target, prop) {
    const instance = getFirebaseAuth();
    const val = (instance as any)[prop];
    return typeof val === "function" ? val.bind(instance) : val;
  }
});

export interface UserRoleData {
  uid: string;
  email: string;
  role: "super_admin" | "editor";
  createdAt: string;
}

// Fetch user profile or initialize if first user in system
export async function getUserRoleProfile(uid: string, email: string): Promise<UserRoleData> {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data() as UserRoleData;
    return {
      uid,
      email: data.email || email,
      role: data.role || "editor",
      createdAt: data.createdAt || new Date().toISOString()
    };
  }

  // Check if users collection is completely empty
  const allUsersSnap = await getDocs(collection(db, "users"));
  const isFirstUserInSystem = allUsersSnap.empty;

  const initialRole: "super_admin" | "editor" = isFirstUserInSystem ? "super_admin" : "editor";

  const newProfile: UserRoleData = {
    uid,
    email: email || "bst490@gmail.com",
    role: initialRole,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(userRef, newProfile);
  } catch (err) {
    console.warn("Could not write user role doc:", err);
  }

  return newProfile;
}

// Fetch all users list for Super Admin
export async function fetchAllUsers(): Promise<UserRoleData[]> {
  const querySnap = await getDocs(collection(db, "users"));
  const usersList: UserRoleData[] = [];
  querySnap.forEach((docSnap) => {
    if (docSnap.exists()) {
      usersList.push(docSnap.data() as UserRoleData);
    }
  });
  return usersList;
}

// Create a new user account without logging out the current Super Admin
export async function createNewUserByAdmin(
  email: string,
  pass: string,
  role: "editor" | "super_admin"
): Promise<UserRoleData> {
  const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
    const newUid = userCred.user.uid;

    const profile: UserRoleData = {
      uid: newUid,
      email: email,
      role: role,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "users", newUid), profile);
    await deleteApp(secondaryApp);
    return profile;
  } catch (err: any) {
    await deleteApp(secondaryApp).catch(() => {});
    throw err;
  }
}

// Update role of a user
export async function updateUserRoleInFirestore(uid: string, newRole: "editor" | "super_admin"): Promise<void> {
  await updateDoc(doc(db, "users", uid), { role: newRole });
}

// Remove user record from Firestore
export async function deleteUserRecordFromFirestore(uid: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid));
}
