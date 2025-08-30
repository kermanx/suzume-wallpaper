import data from "virtual:szm"
import { generate, type StickToDraw } from "./generate"

interface InitCanvasMessage {
  type: 'init',
  canvas: OffscreenCanvas
}

interface GenerateMessage {
  type: 'generate'
  width: number
  height: number
  density: number
  sizeVariation: number
}

export type WorkerMessage = InitCanvasMessage | GenerateMessage

// 加载图片
async function loadImages(): Promise<ImageBitmap[]> {
  const promises = data.map(async (url) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      return await createImageBitmap(blob)
    } catch (error) {
      console.error('Failed to load image:', url, error)
      throw error
    }
  })

  return Promise.all(promises)
}

// 绘制贴纸
async function drawSticks(sticks: StickToDraw[], width: number, height: number) {
  if (!ctx) return

  // 清空画布
  ctx.fillStyle = '#eaffef'
  ctx.fillRect(0, 0, width, height)

  // 绘制所有贴纸
  for (const stick of sticks) {


    const image = loadedImages[stick.index]
    if (!image) continue

    ctx.save()
    ctx.translate(stick.x, stick.y)
    ctx.rotate((stick.angle * Math.PI) / 180)
    ctx.drawImage(image, -stick.size / 2, -stick.size / 2, stick.size, stick.size)
    ctx.restore()

    // await new Promise(resolve => setTimeout(resolve, 200))
  }
}


// 存储加载的图片
let loadedImages: ImageBitmap[] = []
setTimeout(async () => {
  try {
    loadedImages = await loadImages()
    self.postMessage({ type: 'ready', imageCount: loadedImages.length })
  } catch (error) {
    console.log('Error loading images:', error)
    alert('加载图片失败，请重试')
    self.postMessage({ type: 'error', message: 'Failed to load images' })
  }
}, 10)

let offscreenCanvas: OffscreenCanvas | null = null
let ctx: OffscreenCanvasRenderingContext2D | null = null

self.onmessage = async function (e: MessageEvent<WorkerMessage>) {
  const message = e.data

  if (message.type === 'init') {
    offscreenCanvas = message.canvas
    ctx = offscreenCanvas.getContext('2d')
  } else if (message.type === 'generate') {
    if (!ctx || !offscreenCanvas) {
      self.postMessage({ type: 'error', message: 'Canvas not initialized' })
      return
    }

    const sticks = generate(message.width, message.height, loadedImages.length, message.density, message.sizeVariation)
    await drawSticks(sticks, message.width, message.height)

    setTimeout(async () => {
      if (!offscreenCanvas) return
      const blob = await offscreenCanvas.convertToBlob({ type: 'image/png' })
      const reader = new FileReader()
      reader.onloadend = () => {
        self.postMessage({ type: 'generated', blob, dataURL: reader.result })
      }
      reader.readAsDataURL(blob)
    }, 100)
    return
  }
}
