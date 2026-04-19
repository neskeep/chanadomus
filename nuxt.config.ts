// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  app: {
    head: {
      link: [
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'icon', type: 'image/svg+xml', href: '/icons/icon.svg' },
        { rel: 'apple-touch-icon', href: '/icons/icon.svg' },
      ],
      meta: [
        { name: 'theme-color', content: '#1a8a7d' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'ChanaDomus' },
        { name: 'mobile-web-app-capable', content: 'yes' },
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
