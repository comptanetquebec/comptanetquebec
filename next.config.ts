import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // évite le bug de "sharp" pendant le build
  },
  eslint: {
    ignoreDuringBuilds: true, // empêche ESLint de bloquer le déploiement
  },
  typescript: {
    ignoreBuildErrors: true, // empêche les erreurs TS de bloquer le build
  },

  async headers() {
    return [
      {
        source: "/:path*.pdf",
        headers: [
          { key: "Content-Type", value: "application/pdf" },
          { key: "Content-Disposition", value: "inline" },
          // optionnel mais utile
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
