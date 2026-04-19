/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@dbp/shared"],
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
