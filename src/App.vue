<script setup lang="ts">
import { useElementSize } from '@vueuse/core';
import { computed, onMounted, ref, useTemplateRef, watch, type CSSProperties } from 'vue';
import CanvasSettingsDialog from './CanvasSettingsDialog.vue';
import GenerationSettingsDialog from './GenerationSettingsDialog.vue';
import { canvasElement, canvasKey, copyWallpaper, downloadWallpaper, generateWallpaper, imageDataURL, imagesLoaded, isMobile, wallpaperHeight, wallpaperWidth } from './logic';
import { inject } from "@vercel/analytics"

onMounted(() => inject())

const wallpaperRatio = computed(() => wallpaperWidth.value / wallpaperHeight.value)

const canvasContainer = useTemplateRef("canvasContainer")
const { width: containerWidth, height: containerHeight } = useElementSize(canvasContainer)

const copyStatus = ref('')
const copied1 = ref(0)
const copied2 = ref(0)

watch(copied1, t => t && setTimeout(() => copied1.value--, 3000))
watch(copied2, t => t && setTimeout(() => copied2.value--, 3000))

const showCanvasSettings = ref(false)
const showGenerationSettings = ref(false)
const showImageModal = ref(false)
const showAuthorDialog = ref(false)

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
    copied1.value++
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
  showImageModal.value = true
}

// 隐藏放大图片
const hideImageModal = () => {
  showImageModal.value = false
}


// 隐藏作者信息对话框
const hideAuthorDialog = () => {
  showAuthorDialog.value = false
}

const shareToPlatform = (platform: string) => {
  const text = '来试试这个可爱的 Suzume 壁纸生成器喵！'
  const url = 'https://szm.kermanx.com/'

  switch (platform) {
    case 'twitter':
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
      break
    case 'qq':
      // QQ分享
      const qqText = encodeURIComponent(`${text} ${url}`)
      window.open(`https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`, '_blank')
      break
    case 'telegram':
      // Telegram分享
      const telegramText = encodeURIComponent(`${text}\n${url}`)
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
      break
    case 'copy':
      // 复制链接到剪贴板
      navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
        copied2.value++
      })
      break
    case 'native':
      // 使用系统级分享 (Web Share API)
      if (navigator.share) {
        navigator.share({
          title: 'Suzume 壁纸生成器',
          text: text,
          url: url
        }).catch((error) => {
          console.log('分享失败:', error)
        })
      } else {
        // 降级到复制链接
        shareToPlatform('copy')
      }
      break
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 overflow-auto">
    <!-- 主要内容 -->
    <div class="relative z-10 flex flex-col h-full">
      <!-- 标题区域 -->
      <div class="flex-grow-1 flex flex-col justify-center p-2 md:p-8 max-w-4xl mx-auto w-full">
        <div class="text-center mb-4 md:mb-8">
          <h1 class="text-2xl sm:text-3xl md:text-5xl font-bold text-green-700 mb-2 tracking-wide drop-shadow-sm">
            雀宮すずめ壁纸生成器
          </h1>
        </div>

        <!-- 操作按钮组 -->
        <div v-if="imagesLoaded" class="flex flex-wrap justify-center gap-3">
          <button v-if="!isMobile" @click="handleCopy"
            class="flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-full font-semibold bg-gradient-to-r from-green-200 to-emerald-200 text-green-700 hover:from-green-300 hover:to-emerald-300 hover:text-green-800 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1 min-w-[120px] justify-center">
            <span class="text-lg">📋</span>
            {{ copied1 ? '已复制&emsp;' : '复制图像' }}
          </button>

          <button v-if="!isMobile" @click="handleDownload"
            class="flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-full font-semibold bg-gradient-to-r from-green-200 to-emerald-200 text-green-700 hover:from-green-300 hover:to-emerald-300 hover:text-green-800 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1 min-w-[120px] justify-center">
            <span class="text-lg">📥</span>
            下载图像
          </button>

          <button @click="generateWallpaper" :disabled="!imagesLoaded"
            class="flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-full font-semibold text-lg transition-all duration-300 shadow-lg justify-center"
            :class="imagesLoaded
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 hover:shadow-xl hover:-translate-y-1'
              : 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-200 cursor-not-allowed'">
            <span class="text-xl">🎨</span>
            {{ imagesLoaded ? '重新生成' : '加载图片中...' }}
          </button>


          <button v-if="isMobile" @click="handleDownload"
            class="flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-full font-semibold bg-gradient-to-r from-green-200 to-emerald-200 text-green-700 hover:from-green-300 hover:to-emerald-300 hover:text-green-800 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1 min-w-[120px] justify-center">
            <span class="text-lg">📥</span>
            下载图像
          </button>

          <button @click="showCanvasSettings = true"
            class="flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-full font-semibold bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:from-gray-300 hover:to-gray-400 hover:text-gray-800 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1">
            <span class="text-lg">⚙️</span>
            画布设置
          </button>

          <button @click="showGenerationSettings = true"
            class="flex items-center gap-2 px-4 py-2 md:px-6 md:py-2.5 rounded-full font-semibold bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-700 hover:from-blue-300 hover:to-indigo-300 hover:text-blue-800 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1">
            <span class="text-lg">🎨</span>
            生成设置
          </button>
        </div>
      </div>

      <!-- 画布区域 -->
      <div ref="canvasContainer" class="mb-2 mt--6 md:mb-8 flex-grow-10 h-0 flex items-center justify-center p-4">
        <div :style="wrapperStyle"
          class="relative border-3 border-green-300 rounded-2xl shadow-2xl shadow-green-500/20 bg-gradient-to-br from-green-50/80 to-emerald-50/60 overflow-hidden backdrop-blur-sm transition-all duration-300 hover:scale-101 hover:shadow-3xl hover:shadow-green-500/30">
          <canvas :key="canvasKey" :ref="setCanvasEl" :style="canvasStyle" class="rounded-xl cursor-pointer"
            @click="handleCanvasClick"></canvas>
          <div v-if="!imagesLoaded" absolute inset-0 flex items-center justify-center text-2xl text-green-700>
            加载中...
          </div>
        </div>
      </div>
    </div>

    <!-- 设置对话框 -->
    <CanvasSettingsDialog v-model="showCanvasSettings" />
    <GenerationSettingsDialog v-model="showGenerationSettings" />

    <!-- 图片放大弹出框 -->
    <Teleport to="body">
      <Transition enter-active-class="transition-opacity duration-200 ease-out"
        leave-active-class="transition-opacity duration-150 ease-in" enter-from-class="opacity-0"
        enter-to-class="opacity-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="showImageModal"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          @click="hideImageModal">
          <Transition enter-active-class="transition-all duration-200 ease-out"
            leave-active-class="transition-all duration-150 ease-in" enter-from-class="opacity-0 scale-90"
            enter-to-class="opacity-100 scale-100" leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-90">
            <div v-if="showImageModal" class="relative transform-gpu" @click.stop>
              <!-- 关闭按钮 -->
              <button @click="hideImageModal"
                class="fixed top-4 right-4 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200 hover:scale-110">
                <span class="text-xl" i-carbon-close-large />
              </button>

              <!-- 放大的图片 -->
              <img :src="imageDataURL" alt="suzume suzume"
                class="max-w-[98vw] max-h-[98vh] object-contain rounded-2xl shadow-2xl animate-pulse-glow" />
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- 作者信息对话框 -->
    <Teleport to="body">
      <Transition enter-active-class="transition-opacity duration-200 ease-out"
        leave-active-class="transition-opacity duration-150 ease-in" enter-from-class="opacity-0"
        enter-to-class="opacity-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="showAuthorDialog"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          @click="hideAuthorDialog">
          <Transition enter-active-class="transition-all duration-200 ease-out"
            leave-active-class="transition-all duration-150 ease-in" enter-from-class="opacity-0 scale-90 translate-y-4"
            enter-to-class="opacity-100 scale-100 translate-y-0" leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-90 translate-y-4">
            <div v-if="showAuthorDialog"
              class="relative bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 rounded-3xl shadow-2xl p-8 max-w-md mx-4 border-2 border-green-200/50 backdrop-blur-md"
              @click.stop>

              <!-- 可爱的装饰圆点 -->
              <div class="absolute top-4 left-4 w-3 h-3 bg-green-300/40 rounded-full animate-pulse"></div>
              <div class="absolute top-6 right-8 w-2 h-2 bg-emerald-400/50 rounded-full animate-bounce"
                style="animation-delay: 0.5s;"></div>
              <div class="absolute bottom-6 left-6 w-4 h-4 bg-green-200/60 rounded-full animate-pulse"
                style="animation-delay: 1s;"></div>

              <!-- 关闭按钮 -->
              <button @click="hideAuthorDialog"
                class="absolute top-4 right-4 w-8 h-8 bg-green-100 hover:bg-green-200 rounded-full shadow-sm flex items-center justify-center text-green-600 hover:text-green-700 transition-all duration-200 hover:scale-110">
                <span class="text-sm">✕</span>
              </button>

              <!-- 标题 -->
              <div class="text-center mb-6">
                <img class="mx-auto w-12 mb-2" src="/favicon.png" />
                <h3 class="text-xl font-bold text-green-700 mb-1">关于这个小工具</h3>
                <div class="w-12 h-1 bg-gradient-to-r from-green-300 to-emerald-300 rounded-full mx-auto"></div>
              </div>

              <!-- 作者信息 -->
              <div class="space-y-4 text-center">
                <!-- 开发者信息 -->
                <div class="bg-white/70 rounded-2xl p-4 border border-green-200/30 shadow-sm">
                  <div class="text-sm text-green-600 mb-1">💻 开发者</div>
                  <a href="https://x.com/@KermanX_" target="_blank"
                    class="text-green-700 font-semibold hover:text-green-800 transition-colors duration-200 hover:underline">
                    _Kerman
                  </a>
                </div>

                <!-- UP主信息 -->
                <div class="bg-white/70 rounded-2xl p-4 border border-green-200/30 shadow-sm">
                  <div class="text-sm text-green-600 mb-1">📺 UP主</div>
                  <a href="https://space.bilibili.com/6610851" target="_blank"
                    class="text-green-700 font-semibold hover:text-green-800 transition-colors duration-200 hover:underline">
                    bilibili@没有未来的Suzume酱
                  </a>
                </div>

                <!-- 项目仓库 -->
                <div class="bg-white/70 rounded-2xl p-4 border border-green-200/30 shadow-sm">
                  <div class="text-sm text-green-600 mb-1">🌐 项目地址</div>
                  <a href="https://github.com/kermanx/suzume-wallpaper" target="_blank"
                    class="text-green-700 font-semibold hover:text-green-800 transition-colors duration-200 hover:underline break-all">
                    github.com/kermanx/suzume-wallpaper
                  </a>
                </div>


                <!-- 特别感谢-->
                <div class="bg-white/70 rounded-2xl p-4 border border-green-200/30 shadow-sm">
                  <div class="text-sm text-green-600 mb-1">🎉 特别感谢</div>
                  <div class="text-green-700 font-semibold">
                    表情包原作者：五十根炸虾<br>
                    以及<a href="https://github.com/Lingluoluo/More_Suzume" target="_blank"
                      class="text-green-700 font-semibold hover:text-green-800 transition-colors duration-200 hover:underline break-all">
                      Lingluoluo/More_Suzume
                    </a>
                  </div>
                </div>

                <!-- 分享按钮 -->
                <div class="pt-4">
                  <div class="text-sm text-green-600 mb-3">✨ 分享给朋友们</div>
                  <div class="flex flex-wrap justify-center gap-2 max-w-xs mx-auto">
                    <button @click="shareToPlatform('twitter')"
                      class="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full hover:from-blue-200 hover:to-blue-300 hover:text-blue-800 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5">
                      <span>🐦</span>
                      Twitter
                    </button>
                    <button @click="shareToPlatform('telegram')"
                      class="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-100 to-blue-200 text-cyan-700 rounded-full hover:from-cyan-200 hover:to-blue-300 hover:text-cyan-800 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5">
                      <span>✈️</span>
                      Telegram
                    </button>
                    <button @click="shareToPlatform('copy')"
                      class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full hover:from-gray-200 hover:to-gray-300 hover:text-gray-800 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 mx-auto">
                      <span>🔗</span>
                      {{ copied2 ? '已复制' : '复制链接' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>


  <img fixed z-1000 right-0 bottom-0 w-12 md:w-20 hover:scale-y-90 transform-origin-right-bottom transition-all
    active:translate-y-2 md:active:translate-y-4 src="/摸鱼.png" @click="showAuthorDialog = !showAuthorDialog"
    class="cursor-pointer" />
</template>

<style scoped>
@keyframes pulse-glow {

  0%,
  100% {
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
  }

  50% {
    box-shadow: 0 0 40px rgba(34, 197, 94, 0.5), 0 0 80px rgba(34, 197, 94, 0.2);
  }
}

@keyframes twinkle {

  0%,
  100% {
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
