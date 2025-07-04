/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly define environment variables for build and runtime
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    POSTGRES_URL: process.env.POSTGRES_URL,
  },
  // Ensure environment variables are available during build
  serverRuntimeConfig: {
    DATABASE_URL: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  },
  // For development, allow loading from parent directory
  ...(process.env.NODE_ENV === 'development' && {
    experimental: {
      outputFileTracingRoot: '../../',
    },
  }),
}

export default nextConfig
