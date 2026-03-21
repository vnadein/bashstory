/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // sql.js ships a .wasm file; allow Next.js to bundle it in server-side code
  webpack(config, { isServer }) {
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }
    // Treat .wasm files as assets so webpack doesn't try to parse them
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    })
    return config
  },
}

export default nextConfig
