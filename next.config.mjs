/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Di GitHub Pages app disajikan di /Instride/app (di-set oleh workflow); lokal tetap di /
  basePath: process.env.BASE_PATH || '',
  // Dibutuhkan untuk membangun URL redirect absolut (mis. login Google)
  env: { NEXT_PUBLIC_BASE_PATH: process.env.BASE_PATH || '' },
  images: {
    unoptimized: true
  }
};

export default nextConfig;
