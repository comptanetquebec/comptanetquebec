/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  async headers() {
    return [
      {
        source: "/docs/:path*",
        headers: [
          { key: "Content-Type", value: "application/pdf" },
          { key: "Content-Disposition", value: "inline" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/tenue-de-livres/info",
        destination: "/tenue-de-livres-info",
        statusCode: 301,
      },
    ];
  },
};

module.exports = nextConfig;
