import { computed, ref, watch } from "vue"
import type { WorkerMessage } from "./drawing-worker"
import DrawingWorker from './drawing-worker.ts?worker'

export const wallpaperWidth = ref(6000)
export const wallpaperHeight = ref(3164)
export const canvasElement = ref<HTMLCanvasElement | null>(null)
export const imagesLoaded = ref(false)

const drawingWorker = new DrawingWorker()
console.log(111)
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

export function initCanvas() {
  if (!drawingWorker || !canvasElement.value) return
  canvasElement.value.width = wallpaperWidth.value
  canvasElement.value.height = wallpaperHeight.value
  const offscreenCanvas = canvasElement.value.transferControlToOffscreen()
  drawingWorker.postMessage({
    type: 'init',
    canvas: offscreenCanvas
  } satisfies WorkerMessage, [offscreenCanvas])
}


export const canvasKey = ref(0)

export function generateWallpaper() {
  drawingWorker.postMessage({
    type: 'generate',
    width: wallpaperWidth.value,
    height: wallpaperHeight.value
  } satisfies WorkerMessage)
}

watch([canvasElement, imagesLoaded], () => {
  if (!imagesLoaded.value || !canvasElement.value) return
  initCanvas()
  generateWallpaper()
}, { immediate: true })

watch([wallpaperWidth, wallpaperHeight], () => {
  canvasKey.value++
}, { immediate: true })

export function downloadWallpaper() {
  if (!canvasElement.value) return

  const link = document.createElement('a')
  link.download = `suzume-wallpaper-${Date.now()}.png`
  link.href = canvasElement.value.toDataURL('image/png')
  link.click()
}

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
