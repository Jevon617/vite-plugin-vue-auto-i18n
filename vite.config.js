import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueI18n from '@intlify/vite-plugin-vue-i18n'
import path from 'path'
import autoI18n from './vite-plugins/vite-plugin-vue-auto-i18n/index'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    autoI18n({
      output: path.resolve(__dirname, './locales'),
      locale:'jp',
      locales: ['zh', 'en', 'kor', 'jp'],
      sourceDir: path.resolve(__dirname, './src')
    }),
    vueI18n({ include: path.resolve(__dirname, './locales/**')})
  ],
  build: {
    minify: false
  },

  base: '/dist'
})
