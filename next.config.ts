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
  async rewrites() {
    return [
      {
        source: '/proxy/osm-tiles/:z/:x/:y.png',
        destination: 'https://tile.openstreetmap.org/:z/:x/:y.png',
      },
      {
        source: '/proxy/nominatim/:path*',
        destination: 'https://nominatim.openstreetmap.org/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5078/api/:path*',
      },
    ];
  },
};

export default nextConfig;