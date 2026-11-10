const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  typescript: {
    ignoreBuildErrors: true,
  },

  // Lets any stylesheet `@use 'theme' as t;` (styles/_theme.scss).
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
};

module.exports = nextConfig;
