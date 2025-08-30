<script setup lang="ts">
import { computed, useTemplateRef, type CSSProperties, onUnmounted, onMounted, watchEffect, ref } from 'vue';
import { canvasElement, wallpaperHeight, wallpaperWidth, cleanupWorker, initializeWorker, generateWallpaper, imagesLoaded, downloadWallpaper, copyWallpaper } from './logic'
import { useElementSize } from '@vueuse/core';

const wallpaperRatio = computed(() => wallpaperWidth.value / wallpaperHeight.value)

const canvasContainer = useTemplateRef("canvasContainer")
const { width: containerWidth, height: containerHeight } = useElementSize(canvasContainer)

// 复制状态提示
const copyStatus = ref('')

const wrapperStyle = computed(() => {
  const realWidth = Math.min(containerWidth.value, containerHeight.value * wallpaperRatio.value)
  const realHeight = Math.min(containerHeight.value, containerWidth.value / wallpaperRatio.value)
  return {
    width: realWidth + 'px',
    height: realHeight + 'px',
  } as CSSProperties
})

const canvasStyle = computed(() => {
  const realWidth = Math.min(containerWidth.value, containerHeight.value * wallpaperRatio.value)
  const scale = realWidth / wallpaperWidth.value
  return {
    transform: `scale(${scale})`,
    transformOrigin: 'left top',
    borderRadius: '12px',
  } as CSSProperties
})

const setCanvasEl = (el: any) => {
  canvasElement.value = el
}

// 复制功能
const handleCopy = async () => {
  const success = await copyWallpaper()
  if (success) {
    copyStatus.value = '✨ 已复制到剪贴板！'
  } else {
    copyStatus.value = '❌ 复制失败'
  }

  setTimeout(() => {
    copyStatus.value = ''
  }, 2000)
}

// 下载功能
const handleDownload = () => {
  downloadWallpaper()
  copyStatus.value = '📥 开始下载！'
  setTimeout(() => {
    copyStatus.value = ''
  }, 2000)
}

// 初始化
watchEffect(() => {
  if (!canvasElement.value) return;
  canvasElement.value.width = wallpaperWidth.value
  canvasElement.value.height = wallpaperHeight.value

  // 初始化 Worker
  initializeWorker()
})

// 图片加载完成后自动生成壁纸
watchEffect(() => {
  if (imagesLoaded.value) {
    generateWallpaper()
  }
})

// 组件卸载时清理 Worker
onUnmounted(() => {
  cleanupWorker()
})

</script>

<template>
  <div class="fixed inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 overflow-auto">
    <!-- 背景装饰圆圈 -->
    <div class="absolute inset-0 pointer-events-none">
      <div
        class="absolute top-[10%] right-[15%] w-30 h-30 rounded-full bg-gradient-to-br from-green-200/20 to-emerald-200/10 animate-bounce"
        style="animation-delay: -1s;"></div>
      <div
        class="absolute bottom-[20%] left-[10%] w-20 h-20 rounded-full bg-gradient-to-br from-green-300/15 to-emerald-300/8 animate-pulse"
        style="animation-delay: -3s;"></div>
      <div
        class="absolute top-[60%] right-[8%] w-15 h-15 rounded-full bg-gradient-to-br from-green-400/10 to-emerald-400/5 animate-ping"
        style="animation-delay: -5s;"></div>
    </div>

    <!-- 主要内容 -->
    <div class="relative z-10 flex flex-col h-full">
      <!-- 标题区域 -->
      <div class="p-8 max-w-4xl mx-auto w-full">
        <div class="text-center mb-8">
          <h1 class="text-4xl md:text-5xl font-bold text-green-700 mb-2 tracking-wide drop-shadow-sm">
            雀宮すずめ壁纸生成器
          </h1>
        </div>

        <!-- 操作按钮组 -->
        <div class="flex flex-col items-center gap-4">

          <div v-if="imagesLoaded" class="flex flex-col sm:flex-row gap-3">
            <button @click="handleCopy"
              class="flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold bg-gradient-to-r from-green-200 to-emerald-200 text-green-700 hover:from-green-300 hover:to-emerald-300 hover:text-green-800 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1 min-w-[120px] justify-center">
              <span class="text-lg">📋</span>
              复制
            </button>

            <button @click="handleDownload"
              class="flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold bg-gradient-to-r from-green-200 to-emerald-200 text-green-700 hover:from-green-300 hover:to-emerald-300 hover:text-green-800 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1 min-w-[120px] justify-center">
              <span class="text-lg">📥</span>
              下载
            </button>
            <button @click="generateWallpaper" :disabled="!imagesLoaded"
              class="flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 shadow-lg min-w-[180px] justify-center"
              :class="imagesLoaded
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 hover:shadow-xl hover:-translate-y-1'
                : 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-200 cursor-not-allowed'">
              <span class="text-xl">🎨</span>
              {{ imagesLoaded ? '生成新壁纸' : '加载图片中...' }}
            </button>
          </div>
        </div>

        <!-- 状态提示 -->
        <div v-if="copyStatus" class="text-center mt-4">
          <div
            class="inline-block px-6 py-3 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-full text-green-700 font-semibold shadow-md animate-bounce">
            {{ copyStatus }}
          </div>
        </div>
      </div>

      <!-- 画布区域 -->
      <div ref="canvasContainer" class="mb-8 flex-1 h-0 flex items-center justify-center p-4">
        <div :style="wrapperStyle"
          class="border-3 border-green-300 rounded-2xl shadow-2xl shadow-green-500/20 bg-gradient-to-br from-green-50/80 to-emerald-50/60 overflow-hidden backdrop-blur-sm transition-all duration-300 hover:scale-101 hover:shadow-3xl hover:shadow-green-500/30">
          <canvas :ref="setCanvasEl" :style="canvasStyle" class="rounded-xl"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>
