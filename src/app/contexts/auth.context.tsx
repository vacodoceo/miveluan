"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  getAuth,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { AuthContextType, UserType } from "@/app/types/auth";
import {
  signInWithGoogle,
  signOutWithGoogle,
} from "@/lib/firebase/client/auth";
import { setCookie, getCookie } from "cookies-next";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const formatUser = (user: FirebaseUser): UserType => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
});

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<UserType | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(formatUser(firebaseUser));
        setAccessToken(getCookie("accessToken") ?? null);
      } else {
        setAccessToken(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (): Promise<void> => {
    try {
      const userInfo = await signInWithGoogle();

      if (userInfo.user) {
        setUser(formatUser(userInfo.user));
      }

      if (userInfo.accessToken) {
        setCookie("accessToken", userInfo.accessToken);
        setAccessToken(userInfo.accessToken);
      }
    } catch (error) {
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await signOutWithGoogle();

      setCookie("accessToken", "");
      setAccessToken(null);
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);

      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    accessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
