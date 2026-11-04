/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Lab result PDFs are uploaded through a Server Action; the default cap is
    // 1 MB, which is too small for a scanned report.
    serverActions: { bodySizeLimit: "6mb" },
  },
};
export default nextConfig;
