import nextra from "nextra";
import type { NextConfig } from "next";

const withNextra = nextra({
  contentDirBasePath: "/docs",
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextra(nextConfig);
