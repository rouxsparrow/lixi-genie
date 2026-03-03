import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export only when EXPORT_STATIC env var is set
  // This keeps development stable while allowing production static builds
  ...(process.env.EXPORT_STATIC === "true" && {
    output: "export",
  }),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
