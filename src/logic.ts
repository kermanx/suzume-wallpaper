import { computed, ref, watch } from "vue"
import type { WorkerMessage } from "./drawing-worker"
import DrawingWorker from './drawing-worker.ts?worker'
import { useLocalStorage } from "@vueuse/core"

export const isMobile = computed(() => window.innerWidth < 768)

export const wallpaperWidth = useLocalStorage<number>('szm-wallpaper.wallpaperWidth', isMobile ? 2160 : 3840)
export const wallpaperHeight = useLocalStorage<number>('szm-wallpaper.wallpaperHeight', isMobile ? 3840 : 2160)
export const canvasElement = ref<HTMLCanvasElement | null>(null)
export const imagesLoaded = ref(false)
export const imageDataURL = ref('')
export const imageBlob = ref<Blob>()

// 生成设置
export const generateDensity = useLocalStorage<number>('szm-wallpaper.generateDensity', 20)  // 密度 (5-100)
export const generateSizeVariation = useLocalStorage<number>('szm-wallpaper.generateSizeVariation', 1.0)  // 大小离散程度 (0.5-2.0)

const drawingWorker = new DrawingWorker()
drawingWorker.onmessage = (e) => {
  const message = e.data
  if (message.type === 'ready') {
    console.log(`Loaded ${message.imageCount} images`)
    imagesLoaded.value = true
  } else if (message.type === 'generated') {
    console.log('Wallpaper generated')
    imageDataURL.value = message.dataURL
    imageBlob.value = message.blob
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
    height: wallpaperHeight.value,
    density: generateDensity.value,
    sizeVariation: generateSizeVariation.value
  } satisfies WorkerMessage)
}

watch([canvasElement, imagesLoaded], () => {
  if (!imagesLoaded.value || !canvasElement.value) return
  initCanvas()
  generateWallpaper()
}, { immediate: true })

watch([generateDensity, generateSizeVariation], () => {
  if (!imagesLoaded.value || !canvasElement.value) return
  generateWallpaper()
})

watch([wallpaperWidth, wallpaperHeight], () => {
  canvasKey.value++
}, { immediate: true })

export async function downloadWallpaper() {
  if (!canvasElement.value) return

  if (!imageDataURL.value) {
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  if (!imageDataURL.value) {
    alert('获取图片失败')
    return
  }

  const link = document.createElement('a')
  link.download = `suzume-wallpaper-${Date.now()}.png`
  link.href = imageDataURL.value
  link.click()
}

export async function copyWallpaper() {
  if (!canvasElement.value) return

  try {
    if (!imageBlob.value) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
    if (!imageBlob.value) {
      alert('获取图片失败')
      return
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': imageBlob.value
      })
    ])

    return true
  } catch (error) {
    console.error('Failed to copy image:', error)
    return false
  }
}
