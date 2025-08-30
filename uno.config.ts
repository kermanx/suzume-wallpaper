import { defineConfig, presetAttributify, presetIcons, presetWind4, transformerDirectives } from 'unocss'

export default defineConfig({
  presets: [
    presetIcons(),
    presetWind4(),
    presetAttributify(),
  ],
  transformers: [
    transformerDirectives(),
  ]
})
