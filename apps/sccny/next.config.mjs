import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "www.scc-ny.org" },
      { hostname: "scc-ny.org" },
    ],
  },
  transpilePackages: ["dark-blue"],
};

export default withNextIntl(nextConfig);
