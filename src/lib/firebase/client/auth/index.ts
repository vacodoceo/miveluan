import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged as onAuthStateChangedFirebase,
  User,
  signInWithPopup,
} from "firebase/auth";
import { firebaseApp } from "../app";

const auth = getAuth(firebaseApp);

export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return onAuthStateChangedFirebase(auth, callback);
};

export const signInWithGoogle = async (): Promise<{
  user: User;
  accessToken: string;
}> => {
  const provider = new GoogleAuthProvider();
  provider.addScope("https://www.googleapis.com/auth/drive");

  try {
    const userCredential = await signInWithPopup(auth, provider);

    const oauthCredential =
      GoogleAuthProvider.credentialFromResult(userCredential)!;

    const accessToken = oauthCredential.accessToken!;

    return { user: userCredential.user, accessToken };
  } catch (error) {
    console.error("Error signing in with Google", error);

    throw error;
  }
};

export const signOutWithGoogle = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Error signing out", error);

    throw error;
  }
};
