// Prefixes a public/ path with the site base: '/' on Render, '/shivmani-portfolio/' on GitHub Pages
export const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
