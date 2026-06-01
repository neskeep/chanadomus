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

  // CI fallback when .nuxt/ is not fully generated
  return [
    { ignores: ['app/components/ui/**', 'tests/**', '.nuxt/**', '.output/**'] },
  ]
}

export default await createConfig()
