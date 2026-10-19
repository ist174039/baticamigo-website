/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [{ source: "/admin", destination: "/admin/login", permanent: false }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },
};

module.exports = nextConfig;
