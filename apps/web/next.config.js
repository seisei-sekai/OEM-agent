/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Transpile workspace packages
  transpilePackages: ['@repo/domain'],
};

module.exports = nextConfig;

