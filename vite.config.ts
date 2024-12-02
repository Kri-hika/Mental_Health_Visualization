import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import svgstring from 'vite-plugin-svgstring';

export default defineConfig({
  plugins: [
    sveltekit(),
    svgstring()
  ],
  server: {
    fs: {
      // Allow serving files from one level up from the package root
      allow: ['..']
    }
  }
});