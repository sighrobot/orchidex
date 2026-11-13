const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // The genus and registrant dominance charts were once separate pages.
  async redirects() {
    return ['genus', 'registrant'].map((by) => ({
      source: `/learn/${by}-dominance`,
      destination: `/learn/dominance/${by}`,
      permanent: true,
    }));
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // Lets any stylesheet `@use 'theme' as t;` (styles/_theme.scss).
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
};

module.exports = nextConfig;
