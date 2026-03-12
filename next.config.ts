import type { NextConfig } from "next";
// @ts-expect-error next-pwa lacks TS types
import withPWA from "next-pwa";

const pwa = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // skip SW in dev
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
};

export default pwa(nextConfig);
