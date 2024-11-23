import { onAuthStateChanged } from "@/lib/firebase/client/auth";
import { firebaseConfig } from "@/lib/firebase/config";
import { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const useUser = (currentUser?: User): User | void => {
  // The currentUser comes from the server via a server component
  const [user, setUser] = useState(currentUser);
  const router = useRouter();

  // Register the service worker that sends auth state back to server
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const serializedFirebaseConfig = encodeURIComponent(
        JSON.stringify(firebaseConfig)
      );

      const serviceWorkerUrl = `/auth-sw.js?firebaseConfig=${serializedFirebaseConfig}`;

      navigator.serviceWorker
        .register(serviceWorkerUrl)
        .then((registration) => console.log("scope is: ", registration.scope));
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((authUser) => {
      setUser(authUser ?? undefined);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onAuthStateChanged((authUser) => {
      if (user === undefined) return;

      // refresh when user changed to ease testing
      if (user?.email !== authUser?.email) {
        router.refresh();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return user;
};
