import "server-only";

import { headers as getHeaders } from "next/headers";
import { initializeServerApp } from "firebase/app";

import { getAuth, User } from "firebase/auth";
import { firebaseConfig } from "../config";

export async function getAuthenticatedAppForUser() {
  const headers = await getHeaders();
  const idToken = headers.get("Authorization")?.split("Bearer ")[1];

  const firebaseServerApp = initializeServerApp(
    firebaseConfig,
    idToken
      ? {
          authIdToken: idToken,
        }
      : {}
  );

  const auth = getAuth(firebaseServerApp);
  await auth.authStateReady();

  return {
    firebaseServerApp,
    currentUser: { ...auth.currentUser?.toJSON(), idToken } as
      | (User & { idToken: string })
      | undefined,
  };
}
