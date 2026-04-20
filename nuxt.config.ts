// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: false },

  app: {
    head: {
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/icons/icon-192.png' },
      ],
      meta: [
        { name: 'theme-color', content: '#a08b7a' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      ],
    },
  },

  modules: [
    '@vueuse/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [
      (await import('@tailwindcss/vite')).default(),
    ],
    server: {
      hmr: {
        protocol: 'ws',
        port: 24678,
      },
    },
  },

  components: [
    { path: '~/components/ui', pathPrefix: false, extensions: ['.vue'] },
    { path: '~/components' },
  ],

  typescript: {
    strict: true,
  },

  nitro: {
    experimental: {
      websocket: true,
    },
  },
})
