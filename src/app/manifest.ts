import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Moods Specialty Coffee",
    short_name: "The Moods",
    description: "Hệ Thống Tích Điểm & Vận Hành F&B SaaS",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/android/launchericon-48x48.png?v=6",
        sizes: "48x48",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android/launchericon-72x72.png?v=6",
        sizes: "72x72",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android/launchericon-96x96.png?v=6",
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android/launchericon-144x144.png?v=6",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android/launchericon-192x192.png?v=6",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android/launchericon-512x512.png?v=6",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png?v=6",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png?v=6",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

