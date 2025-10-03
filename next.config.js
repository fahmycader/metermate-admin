/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    CUSTOM_KEY: "some_value", // put your actual value here
  },
};

module.exports = nextConfig;
