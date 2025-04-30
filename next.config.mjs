/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    serverExternalPackages: ['@sequelize/core', 'sequelize', 'sqlite3'],
};

export default nextConfig;

