import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 本番環境でconsole.logを自動削除
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"], // errorとwarnは残す
          }
        : false,
  },

  // Server Actions CSRF対策
  // Next.js 16はOrigin/Host headerを自動比較してCSRF攻撃を防ぐ
  // 本番環境でリバースプロキシ等を使用する場合は allowedOrigins を設定
  experimental: {
    serverActions: {
      // allowedOrigins: ["example.com", "*.example.com"], // 必要に応じて設定
    },
  },
};

export default nextConfig;
