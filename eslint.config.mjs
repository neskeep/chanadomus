import { existsSync } from 'node:fs'

async function createConfig() {
  const nuxtConfigPath = './.nuxt/eslint.config.mjs'

  if (existsSync(nuxtConfigPath)) {
    const { default: withNuxt } = await import(nuxtConfigPath)
    return withNuxt(
      { ignores: ['app/components/ui/**', 'tests/**'] },
      { rules: { 'vue/require-default-prop': 'off' } },
    )
  }

  // CI fallback — skip lint entirely when Nuxt hasn't generated the ESLint config
  return [{ ignores: ['**'] }]
}

export default await createConfig()
