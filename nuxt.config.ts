// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: false },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
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
    optimizeDeps: {
      include: [
        'lucide-vue-next',
        'vue-sonner',
        'clsx',
        'tailwind-merge',
        'reka-ui',
        'better-auth/vue',
        'better-auth/client/plugins',
        'class-variance-authority',
        'better-auth/plugins/access',
      ],
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
    imports: {
      imports: [
        {
          name: 'useAppConfig',
          from: '#app-config',
          priority: 10,
        },
      ],
    },
  },
})
