"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthRouteGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const currentPath = pathname || "/";
    const isAuthCallback = currentPath.startsWith("/auth/callback");
    if (isAuthCallback) return;

    if (!user && currentPath !== "/guest") {
      router.replace("/guest");
      return;
    }

    if (user && currentPath === "/guest") {
      router.replace("/");
    }
  }, [loading, pathname, router, user]);

  return <>{children}</>;
}
