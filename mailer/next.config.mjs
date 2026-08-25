/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // List uploads are posted through a server action, so the action body limit
    // is what caps how big a CSV can be (~10 MB ≈ 150k addresses).
    serverActions: { bodySizeLimit: "10mb" },
  },
};
export default nextConfig;
