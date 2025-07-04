/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly define environment variables for build and runtime
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
}

export default nextConfig
