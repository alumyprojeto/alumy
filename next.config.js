/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Garante que o banco-base SQLite seja incluído no pacote das funções serverless,
  // para ser copiado para /tmp em tempo de execução (ver src/lib/prisma.ts).
  experimental: {
    outputFileTracingIncludes: {
      "/**": ["./prisma/base.sqlite"],
    },
  },
};

module.exports = nextConfig;
