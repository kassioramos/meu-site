/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignora o lint durante o build na Vercel para não travar por avisos bobos
    ignoreDuringBuilds: true,
  },
  // O Turbopack (usado no Next 15) às vezes precisa que apontemos a raiz se houver subpastas
  images: {
    unoptimized: true, // Opcional: útil se você usa o plano gratuito da Vercel para imagens do Supabase
  }
};

export default nextConfig;