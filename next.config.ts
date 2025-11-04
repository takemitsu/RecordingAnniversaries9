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
};

export default nextConfig;
