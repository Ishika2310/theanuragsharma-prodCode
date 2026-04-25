import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  base: './', // Add base path for relative URLs
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/index.html'),
        bookSession: resolve(__dirname, 'src/booksession.html'),
        technologyDiplomacy: resolve(__dirname, 'src/technology-diplomacy.html'),
        spacePower: resolve(__dirname, 'src/space-power.html'),
        economicDiplomacy: resolve(__dirname, 'src/economic-diplomacy.html'),
        publications: resolve(__dirname, 'src/publications.html'),
        defence: resolve(__dirname, 'src/defence.html'),
        multipolar: resolve(__dirname, 'src/multipolar.html'),
        comprehensive: resolve(__dirname, 'src/comprehensive.html'),
        outerSpace: resolve(__dirname, 'src/outer-space.html'),
        rimland: resolve(__dirname, 'src/rimland.html'),
        antarctic: resolve(__dirname, 'src/antarctic.html'),
        himalayas: resolve(__dirname, 'src/himalayas.html'),
        deepSea: resolve(__dirname, 'src/deep-sea.html'),
        arctic: resolve(__dirname, 'src/arctic.html'),
        login: resolve(__dirname, 'src/admin-login.html'),
        dashboard: resolve(__dirname, 'src/admin-dashboard.html'),
        privacyPolicy: resolve(__dirname, 'src/privacy-policy.html'),
        events: resolve(__dirname, 'src/conferences-delegations.html'),
        subjectMatterExpert: resolve(__dirname, 'src/subject-matter-knowledge.html')
      },
    },
  },
});
