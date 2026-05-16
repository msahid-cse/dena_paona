import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'denapaonaxd.vercel.app'],
    },
  },
  serverExternalPackages: ['pg', 'bcryptjs', 'nodemailer'],
};

export default nextConfig;
