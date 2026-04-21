/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['vm-77075tm8in1sdklo5q69s6qy.vusercontent.net'],
}

export default nextConfig
