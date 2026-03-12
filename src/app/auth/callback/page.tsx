"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    async function handle() {
      const code = new URLSearchParams(window.location.search).get("code");
      if (!code) {
        router.push("/");
        return;
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data.session) {
        router.push("/");
        return;
      }

      // Check if profile already exists in public.users
      const profileRes = await fetch(`/api/users/${data.session.user.id}`);
      if (profileRes.status === 404) {
        router.push("/auth/role");
      } else {
        router.push("/");
      }
    }

    handle();
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <span className="text-5xl animate-pulse">⚡</span>
      <p className="text-sm text-gray-500">Completing sign-in…</p>
    </div>
  );
}
