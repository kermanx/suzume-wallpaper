import { ref } from "vue"
import DrawingWorker from './drawing-worker.ts?worker'

export const wallpaperWidth = ref(6000)
export const wallpaperHeight = ref(3164)
export const canvasElement = ref<HTMLCanvasElement | null>(null)
export const imagesLoaded = ref(false)

// 创建 Worker 实例
let drawingWorker: Worker | null = null
let offscreenCanvas: OffscreenCanvas | null = null

export function initializeWorker() {
  if (!canvasElement.value) return
  
  drawingWorker = new DrawingWorker()
  offscreenCanvas = canvasElement.value.transferControlToOffscreen()
  
  // 监听 worker 消息
  drawingWorker.onmessage = (e) => {
    const message = e.data
    if (message.type === 'ready') {
      console.log(`Loaded ${message.imageCount} images`)
      imagesLoaded.value = true
    } else if (message.type === 'generated') {
      console.log('Wallpaper generated')
    } else if (message.type === 'error') {
      console.error('Worker error:', message.message)
    }
  }
  
  // 初始化 worker
  drawingWorker.postMessage({
    type: 'init',
    canvas: offscreenCanvas
  }, [offscreenCanvas])
}

export function generateWallpaper() {
  if (!drawingWorker) return
  
  drawingWorker.postMessage({
    type: 'generate',
    width: wallpaperWidth.value,
    height: wallpaperHeight.value
  })
}

// 下载壁纸
export function downloadWallpaper() {
  if (!canvasElement.value) return
  
  const link = document.createElement('a')
  link.download = `suzume-wallpaper-${Date.now()}.png`
  link.href = canvasElement.value.toDataURL('image/png')
  link.click()
}

// 复制壁纸到剪贴板
export async function copyWallpaper() {
  if (!canvasElement.value) return
  
  try {
    const canvas = canvasElement.value
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
      }, 'image/png')
    })
    
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob
      })
    ])
    
    return true
  } catch (error) {
    console.error('Failed to copy image:', error)
    return false
  }
}

// 清理 Worker
export function cleanupWorker() {
  if (drawingWorker) {
    drawingWorker.terminate()
    drawingWorker = null
  }
  offscreenCanvas = null
  imagesLoaded.value = false
}