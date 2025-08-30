<script setup lang="ts">
import { useElementSize } from '@vueuse/core';
import { computed, ref, useTemplateRef, type CSSProperties } from 'vue';
import { canvasElement, canvasKey, copyWallpaper, downloadWallpaper, generateWallpaper, imagesLoaded, wallpaperHeight, wallpaperWidth } from './logic';
import CanvasSettingsDialog from './CanvasSettingsDialog.vue';
import GenerationSettingsDialog from './GenerationSettingsDialog.vue';

const wallpaperRatio = computed(() => wallpaperWidth.value / wallpaperHeight.value)

const canvasContainer = useTemplateRef("canvasContainer")
const { width: containerWidth, height: containerHeight } = useElementSize(canvasContainer)

const copyStatus = ref('')

const showCanvasSettings = ref(false)
const showGenerationSettings = ref(false)
const showImageModal = ref(false)
const modalImageSrc = ref('')

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

// 点击canvas放大显示
const handleCanvasClick = () => {
  if (!canvasElement.value) return
  
  // 将canvas转换为图片数据URL
  modalImageSrc.value = canvasElement.value.toDataURL('image/png')
  showImageModal.value = true
}

// 隐藏放大图片
const hideImageModal = () => {
  showImageModal.value = false
}
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
      <div class="flex-grow-1 flex flex-col justify-center p-8 max-w-4xl mx-auto w-full">
        <div class="text-center mb-8">
          <h1 class="text-4xl md:text-5xl font-bold text-green-700 mb-2 tracking-wide drop-shadow-sm">
            雀宮すずめ壁纸生成器
          </h1>
        </div>

        <!-- 操作按钮组 -->
        <div v-if="imagesLoaded" class="flex flex-wrap justify-center gap-3">
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

          <button @click="showCanvasSettings = true"
            class="flex items-center gap-2 px-4 py-2 rounded-full font-semibold bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:from-gray-300 hover:to-gray-400 hover:text-gray-800 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1">
            <span class="text-lg">⚙️</span>
            画布设置
          </button>

          <button @click="showGenerationSettings = true"
            class="flex items-center gap-2 px-4 py-2 rounded-full font-semibold bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-700 hover:from-blue-300 hover:to-indigo-300 hover:text-blue-800 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1">
            <span class="text-lg">🎨</span>
            生成设置
          </button>
        </div>

        <!-- 状态提示 -->
        <div v-if="copyStatus" class="absolute text-center mt-4">
          <div
            class="inline-block px-6 py-3 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-full text-green-700 font-semibold shadow-md ">
            {{ copyStatus }}
          </div>
        </div>
      </div>

      <!-- 画布区域 -->
      <div ref="canvasContainer" class="mb-8 flex-grow-10 h-0 flex items-center justify-center p-4">
        <div :style="wrapperStyle"
          class="border-3 border-green-300 rounded-2xl shadow-2xl shadow-green-500/20 bg-gradient-to-br from-green-50/80 to-emerald-50/60 overflow-hidden backdrop-blur-sm transition-all duration-300 hover:scale-101 hover:shadow-3xl hover:shadow-green-500/30">
          <canvas :key="canvasKey" :ref="setCanvasEl" :style="canvasStyle" class="rounded-xl cursor-pointer" @click="handleCanvasClick"></canvas>
        </div>
      </div>
    </div>

    <!-- 设置对话框 -->
    <CanvasSettingsDialog v-model="showCanvasSettings" />
    <GenerationSettingsDialog v-model="showGenerationSettings" />

    <!-- 图片放大弹出框 -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out"
        leave-active-class="transition-opacity duration-150 ease-in"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showImageModal" 
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          @click="hideImageModal">
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            leave-active-class="transition-all duration-150 ease-in"
            enter-from-class="opacity-0 scale-90"
            enter-to-class="opacity-100 scale-100"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-90"
          >
            <div v-if="showImageModal" class="relative transform-gpu"
              @click.stop>
              <!-- 关闭按钮 -->
              <button 
                @click="hideImageModal"
                class="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200 hover:scale-110">
                <span class="text-xl">✕</span>
              </button>
              
              <!-- 放大的图片 -->
              <img 
                :src="modalImageSrc" 
                alt="放大的壁纸"
                class="max-w-[98vw] max-h-[98vh] object-contain rounded-2xl shadow-2xl animate-pulse-glow"
              />
              
              <!-- 装饰性的光点效果 -->
              <div class="absolute inset-0 pointer-events-none">
                <div class="absolute top-[20%] left-[10%] w-3 h-3 bg-green-400/60 rounded-full animate-twinkle" style="animation-delay: 0s;"></div>
                <div class="absolute top-[70%] right-[15%] w-2 h-2 bg-emerald-400/60 rounded-full animate-twinkle" style="animation-delay: 1s;"></div>
                <div class="absolute bottom-[30%] left-[20%] w-4 h-4 bg-green-300/50 rounded-full animate-twinkle" style="animation-delay: 2s;"></div>
                <div class="absolute top-[40%] right-[30%] w-2 h-2 bg-emerald-300/60 rounded-full animate-twinkle" style="animation-delay: 0.5s;"></div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(34, 197, 94, 0.5), 0 0 80px rgba(34, 197, 94, 0.2);
  }
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.5);
  }
}

.animate-pulse-glow {
  animation: pulse-glow 3s ease-in-out infinite;
}

.animate-twinkle {
  animation: twinkle 2s ease-in-out infinite;
}
</style>
