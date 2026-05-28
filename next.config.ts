import type { NextConfig } from "next";

process.env.TZ ??= "Asia/Ho_Chi_Minh";

const nextConfig: NextConfig = {
  env: {
    TZ: "Asia/Ho_Chi_Minh",
  },
};

export default nextConfig;
