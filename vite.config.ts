import vue from '@vitejs/plugin-vue'
import { readdirSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import sharp from 'sharp'
import UnoCSS from 'unocss/vite'
import { defineConfig, Plugin } from 'vite'

async function hasTransparentCorners(buffer: Buffer): Promise<boolean> {
  try {
    const image = sharp(buffer)
    const { width, height } = await image.metadata()

    if (!width || !height) return false

    // 获取RGBA像素数据
    const { data } = await image.raw().toBuffer({ resolveWithObject: true })

    const topLeftIndex = (0) * 4 + 3
    const topLeftAlpha = data[topLeftIndex]

    const topRightIndex = (0 * width + (width - 1)) * 4 + 3
    const topRightAlpha = data[topRightIndex]

    const bottomLeftIndex = ((height - 1) * width + 0) * 4 + 3
    const bottomLeftAlpha = data[bottomLeftIndex]

    const bottomRightIndex = ((height - 1) * width + (width - 1)) * 4 + 3
    const bottomRightAlpha = data[bottomRightIndex]

    return !topLeftAlpha && !topRightAlpha
  } catch (error) {
    console.warn('Error processing image:', error)
    return false
  }
}

const szmFiles = Promise.all(
  readdirSync(resolve(import.meta.dirname, 'suzume'))
    .map(async filename => {
      const buffer = await readFile(resolve(import.meta.dirname, 'suzume', filename))
      const hasTransparent = await hasTransparentCorners(buffer)
      // if (!hasTransparent) console.warn('Image has no transparent corners: ./suzume/' + filename)
      return hasTransparent ? buffer : null
    })
).then(buffers => buffers.filter((buffer): buffer is Buffer => buffer !== null))

const szmPlugin = (): Plugin => ({
  name: 'szm-assets',
  resolveId(id) {
    if (id === 'virtual:szm') {
      return '\0szm'
    }
  },
  async load(id) {
    if (id === '\0szm') {
      const files = await szmFiles;
      return `export default [
            ${files.map(content => `'data:image/png;base64,${content.toString('base64')}'`).join(',\n')}
          ]`
    }
  }
})

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    szmPlugin(),
  ],
  worker: {
    plugins: () => [szmPlugin()]
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
