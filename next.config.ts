import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["themoods.tieenz.site"],
  async headers() {
    return [
      {
        source: "/:path*.(png|jpg|jpeg|ico|svg|webp)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;