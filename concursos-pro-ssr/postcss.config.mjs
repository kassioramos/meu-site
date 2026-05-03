/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {}, // Note a mudança aqui
    "autoprefixer": {},
  },
};

export default config;