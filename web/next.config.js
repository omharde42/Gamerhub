/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { domains: ['res.cloudinary.com', 'via.placeholder.com', 'avatars.githubusercontent.com'], formats: ['image/avif', 'image/webp'] },
  experimental: { serverActions: { bodySizeLimit: '10mb' } },
  optimizePackageImports: [],
};
module.exports = nextConfig;
