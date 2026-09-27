import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Phones join over the LAN during the demo; the dev server must serve chunks to that origin.
  allowedDevOrigins: ["192.168.1.199", "192.168.*.*", "10.*.*.*", "172.16.*.*", "*.local"],
  // Hide the dev badge so it never sits over a card during the demo.
  devIndicators: false,
};

export default nextConfig;
