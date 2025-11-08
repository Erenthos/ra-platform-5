/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Enable experimental appDir features (Next 15+)
  experimental: {
    serverActions: true,
    turbo: {
      rules: {
        // Allow .ts, .tsx, .mjs, etc. in /src
        "*.ts": ["typescript"],
        "*.tsx": ["typescript"],
      },
    },
  },

  // Configure images (optional but useful for logos, etc.)
  images: {
    domains: ["localhost", "your-render-app-name.onrender.com"],
    formats: ["image/avif", "image/webp"],
  },

  // Needed for socket.io and API routes to work on Render
  output: "standalone",

  // Optimize fonts
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;

