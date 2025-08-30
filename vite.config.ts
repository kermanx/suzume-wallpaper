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

    const notTransparent = (x: number, y: number) => {
      const index = Math.floor((y * width + x) * 4 + 3)
      return data[index] !== 0
    }

    const blackOrWhite = (x: number, y: number) => {
      const index = Math.floor((y * width + x) * 4)
      if (data[index] === 0 && data[index + 1] === 0 && data[index + 2] === 0 && data[index + 3] === 255) {
        return true
      }
      if (data[index] === 255 && data[index + 1] === 255 && data[index + 2] === 255 && data[index + 3] === 255) {
        return true
      }
    }

    if (notTransparent(0, 0) && notTransparent(width - 1, 0)) {
      return false
    }

    // if (notTransparent(0, height - 1) && notTransparent(width - 1, height - 1)) {
    //   return false
    // }

    if (blackOrWhite(0, height - 1) && blackOrWhite(width - 1, height - 1)) {
      return false
    }

    if (notTransparent(0, height / 2) && notTransparent(width - 1, height / 2)) {
      return false
    }

    if (notTransparent(width / 2, 0) && notTransparent(width / 2, height - 1)) {
      return false
    }

    return true
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
      return `export default JSON.parse('[${files.map(content => `"data:image/png;base64,${content.toString('base64')}"`).join(',')}]')`
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
