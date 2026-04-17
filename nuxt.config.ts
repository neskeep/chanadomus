// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  modules: [
    '@vueuse/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [
      (await import('@tailwindcss/vite')).default(),
    ],
  },

  components: [
    { path: '~/components/ui', pathPrefix: false },
    { path: '~/components' },
  ],

  typescript: {
    strict: true,
  },

  experimental: {
    websocket: true,
  },
})
