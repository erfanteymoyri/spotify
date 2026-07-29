import type { NextConfig } from "next";

/**
 * Covers uploaded media served by MinIO. `next/image` refuses any host that is
 * not listed here, so the object-store origin has to be declared explicitly.
 * Kept configurable because the host differs between local, compose and any
 * deployed environment.
 */
const mediaHost = process.env.NEXT_PUBLIC_MEDIA_HOST ?? "localhost:9000";
const [mediaHostname, mediaPort] = mediaHost.split(":");

// next/image optimizes by fetching the file server-side, and Next 16 refuses
// to do that for any host resolving to a private/local IP (localhost, minio)
// unless dangerouslyAllowLocalIP is set. Simplest fix for a local object store:
// skip optimization and let the browser load covers directly from MinIO.
const mediaIsLocal = ["localhost", "127.0.0.1", "::1", "minio"].includes(
  mediaHostname,
);

const nextConfig: NextConfig = {
  // Produces a self-contained server bundle for the Docker runtime stage.
  output: "standalone",
  experimental: {
    // "radix-ui" and "motion" are barrel packages; without this Next ships
    // every submodule to the client instead of just what's imported,
    // bloating the bundle and slowing first paint/hydration.
    optimizePackageImports: ["radix-ui", "motion"],
  },
  images: {
    unoptimized: mediaIsLocal,
    remotePatterns: [
      {
        protocol: "http",
        hostname: mediaHostname,
        port: mediaPort ?? "",
      },
      {
        protocol: "https",
        hostname: mediaHostname,
        port: mediaPort ?? "",
      },
      // Covers a MinIO service reached by its compose hostname.
      { protocol: "http", hostname: "minio", port: "9000" },
    ],
  },
};

export default nextConfig;
