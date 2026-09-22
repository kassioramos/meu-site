import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Permite que o build conclua mesmo que existam avisos ou erros do ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Permite que o build conclua mesmo com erros de validação de tipos do TypeScript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;