// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  components: [
    { path: '~/components/ui', pathPrefix: false },
    { path: '~/components/game', pathPrefix: false },
  ],
  nitro: {
    preset: 'node-server',
    experimental: {
      websocket: true,
    },
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    public: {
      wsBase: process.env.NUXT_PUBLIC_WS_BASE || '',
    },
  },
})
