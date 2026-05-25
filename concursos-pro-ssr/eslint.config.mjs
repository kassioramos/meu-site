/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Isso ignora o lint apenas na hora do "npm run build" na Vercel
    ignoreDuringBuilds: true,
  },
  // ... mantenha qualquer outra configuração que você já tenha aqui dentro
};

export default nextConfig;