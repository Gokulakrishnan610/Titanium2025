import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["images.unsplash.com", "th.bing.com", "localhost", "radium.devsrec.com"],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: false, // Temporarily enable PWA in development for testing
})(nextConfig);
