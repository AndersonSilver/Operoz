/** @type {import('lint-staged').Config} */
export default {
  "*.{js,jsx,ts,tsx,cjs,mjs,cts,mts,json,css,md}": (files) =>
    files.map((file) => `pnpm exec oxfmt --no-error-on-unmatched-pattern ${JSON.stringify(file)}`),
};
