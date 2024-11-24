import { useAuth } from "@/app/contexts/auth.context";
import { useRouter } from "next/router";
import { useEffect, ComponentType } from "react";

export function ProtectedRoute<P extends object>(
  WrappedComponent: ComponentType<P>
) {
  return function WithAuthWrapper(props: P): JSX.Element | null {
    const { user, loading } = useAuth();

    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.replace("/login");
      }
    }, [loading, user, router]);

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!user) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
