/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: `next build` emits a folder of plain files (./out) that the
  // app runs from entirely offline. There is no server code anywhere.
  output: "export",
  reactStrictMode: true,
};

export default nextConfig;
