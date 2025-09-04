import vue from '@vitejs/plugin-vue'
import { readdirSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import sharp from 'sharp'
import UnoCSS from 'unocss/vite'
import { defineConfig, Plugin } from 'vite'
import crypto from 'crypto';

export async function uploadString(content: string): Promise<string> {
  const buffer = Buffer.from(content);
  const md5Hash = crypto.createHash('md5').update(buffer).digest('hex')

  const formData = new globalThis.FormData();

  const file = new File([buffer], 'data.json', {
    type: 'application/json',
  });
  formData.append('files', file);

  const headers = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
    "sec-ch-ua": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Microsoft Edge\";v=\"138\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Linux\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "Referer": "https://xhfs0.ztytech.com/",
    'XueHai-MD5': md5Hash,
  };

  const response = await fetch("https://filesoss.yunzuoye.net/XHFileServer/file/upload/CA107011/", {
    method: 'POST',
    headers: headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} ${await response.text()}`);
  }

  const data: any = await response.json();
  return data.uploadFileDTO.fileId;
}


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
).then(async buffers => {
  const files = buffers.filter((buffer): buffer is Buffer => buffer !== null)
  const json = `[${files.map(content => `"data:image/png;base64,${content.toString('base64')}"`).join(',')}]`
  return {
    json,
    cdn: await uploadString(json)
  }
})

const szmPlugin = (): Plugin => ({
  name: 'szm-assets',
  config() {
    return {
      build: {
        rolldownOptions: {
          output: {
            manualChunks: (id) => {
              console.log(id)
            }
          }
        }
      }
    }
  },
  resolveId(id) {
    if (id === 'virtual:szm') {
      return '\0szm'
    }
    if (id === 'virtual:szm-data') {
      return '\0szm-data'
    }
  },
  async load(id) {
    if (id === '\0szm') {
      return `export default async () => {
  try {
    const data = await fetch(${JSON.stringify((await szmFiles).cdn)})
    if (data.ok) {
      return data.json()
    }
  } catch {}
  return await import('virtual:szm-data').then(m => m.default)
}`
    }
    if (id === '\0szm-data') {
      return {
        code: `export default JSON.parse('${(await szmFiles).json}')`,
        moduleSideEffects: true,
      }
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
    format: "es",
    plugins: () => [szmPlugin()]
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
