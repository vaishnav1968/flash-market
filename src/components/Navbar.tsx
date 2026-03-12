"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading, signInWithGoogle, signOut } = useAuth();

  const navLinks = [
    { href: "/", label: "🛒 Marketplace" },
    ...(user ? [{ href: "/vendor", label: "📦 Vendor Dashboard" }] : []),
    ...(user ? [{ href: "/deliveries", label: "🗺 Delivery Map" }] : []),
  ];

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-2 px-4 py-3 sm:flex-nowrap sm:gap-y-0 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="text-lg font-extrabold tracking-tight text-gray-900">
            Flash<span className="text-[#458B73]">Market</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto whitespace-nowrap pb-1 hide-scrollbar sm:order-none sm:w-auto sm:overflow-visible sm:pb-0">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-[#458B73]/10 text-[#458B73]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Notification bell (vendors only) */}
        <div className="order-2 sm:order-none">
          <NotificationBell />
        </div>

        {/* Auth */}
        <div className="order-2 flex items-center gap-2 sm:order-none">
          {loading ? (
            <span className="text-lg animate-pulse">⚡</span>
          ) : user ? (
            <>
              <div className="flex items-center gap-2">
                {user.user_metadata?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.user_metadata.avatar_url as string}
                    alt="avatar"
                    className="h-7 w-7 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#458B73]/20 text-xs font-bold text-[#458B73]">
                    {(
                      (user.user_metadata?.full_name as string)?.[0] ??
                      user.email?.[0] ??
                      "?"
                    ).toUpperCase()}
                  </div>
                )}
                <span className="hidden text-xs font-medium text-gray-700 sm:block">
                  {(user.user_metadata?.full_name as string)?.split(" ")[0] ??
                    user.email?.split("@")[0]}
                </span>
                {role && (
                  <span
                    className={`hidden rounded-full px-2 py-0.5 text-[10px] font-semibold lg:block ${
                      role === "vendor"
                        ? "bg-[#FF9760]/20 text-[#FF9760]"
                        : "bg-[#458B73]/20 text-[#458B73]"
                    }`}
                  >
                    {role}
                  </span>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Sign out
              </button>
              <Link
                href="/auth/role"
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Choose role
              </Link>
            </>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 rounded-lg bg-[#458B73] px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-[#458B73]/90 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
