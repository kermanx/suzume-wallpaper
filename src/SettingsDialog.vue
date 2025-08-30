<script setup lang="ts">
import { ref, computed } from 'vue'
import { wallpaperWidth, wallpaperHeight } from './logic'

const show = defineModel<boolean>()

// 预设尺寸选项
const presetSizes = [
  { name: '4K 横屏', width: 3840, height: 2160, ratio: '16:9' },
  { name: '2K 横屏', width: 2560, height: 1440, ratio: '16:9' },
  { name: 'Full HD', width: 1920, height: 1080, ratio: '16:9' },
  { name: '4K 竖屏', width: 2160, height: 3840, ratio: '9:16' },
  { name: '手机壁纸', width: 1080, height: 1920, ratio: '9:16' },
  { name: '超宽屏', width: 3440, height: 1440, ratio: '21:9' },
  { name: '当前设置', width: wallpaperWidth.value, height: wallpaperHeight.value, ratio: `${wallpaperWidth.value}:${wallpaperHeight.value}` },
]

// 当前选中的尺寸
const selectedWidth = ref(wallpaperWidth.value)
const selectedHeight = ref(wallpaperHeight.value)
const customMode = ref(false)

// 选择预设尺寸
const selectPreset = (preset: typeof presetSizes[0]) => {
  selectedWidth.value = preset.width
  selectedHeight.value = preset.height
  customMode.value = false
}

// 切换到自定义模式
const enableCustomMode = () => {
  customMode.value = true
}

// 应用设置
const applySettings = () => {
  wallpaperWidth.value = selectedWidth.value
  wallpaperHeight.value = selectedHeight.value
  show.value = false
}

// 关闭对话框
const closeDialog = () => {
  show.value = false
}

// 计算比例
const currentRatio = computed(() => {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
  const divisor = gcd(selectedWidth.value, selectedHeight.value)
  return `${selectedWidth.value / divisor}:${selectedHeight.value / divisor}`
})
</script>

<template>
  <!-- 遮罩层 -->
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- 背景遮罩 -->
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeDialog"></div>

    <!-- 对话框 -->
    <div
      class="relative bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-2xl shadow-green-500/20 border-2 border-green-200 max-w-md w-full max-h-[80vh] overflow-auto">
      <!-- 头部 -->
      <div class="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-t-2xl">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <span class="text-2xl">⚙️</span>
            画布设置
          </h2>
          <button @click="closeDialog" class="p-1 hover:bg-white/20 rounded-full transition-colors">
            <span class="text-xl">✕</span>
          </button>
        </div>
      </div>

      <!-- 内容 -->
      <div class="p-6 space-y-6">
        <!-- 当前尺寸显示 -->
        <div class="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-xl border-2 border-green-200">
          <div class="text-center">
            <p class="text-green-700 font-semibold mb-1">当前画布尺寸</p>
            <p class="text-2xl font-bold text-green-800">{{ selectedWidth }} × {{ selectedHeight }}</p>
            <p class="text-sm text-green-600">比例: {{ currentRatio }}</p>
          </div>
        </div>

        <!-- 预设尺寸选择 -->
        <div>
          <h3 class="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span class="text-xl">📐</span>
            预设尺寸
          </h3>
          <div class="grid grid-cols-1 gap-2">
            <button v-for="preset in presetSizes" :key="preset.name" @click="selectPreset(preset)"
              class="p-3 text-left rounded-xl border-2 transition-all duration-200 hover:shadow-md" :class="selectedWidth === preset.width && selectedHeight === preset.height && !customMode
                ? 'border-green-400 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 shadow-md'
                : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50 text-gray-700'">
              <div class="flex justify-between items-center">
                <div>
                  <p class="font-semibold">{{ preset.name }}</p>
                  <p class="text-sm opacity-75">{{ preset.width }} × {{ preset.height }}</p>
                </div>
                <span class="text-xs px-2 py-1 bg-gray-100 rounded-full">{{ preset.ratio }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- 自定义尺寸 -->
        <div>
          <h3 class="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span class="text-xl">✏️</span>
            自定义尺寸
          </h3>
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">宽度 (px)</label>
                <input v-model.number="selectedWidth" @input="enableCustomMode" type="number" min="100" max="10000"
                  class="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-green-400 focus:outline-none transition-colors"
                  :class="customMode ? 'border-green-400 bg-green-50' : ''" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">高度 (px)</label>
                <input v-model.number="selectedHeight" @input="enableCustomMode" type="number" min="100" max="10000"
                  class="w-full p-2 border-2 border-gray-200 rounded-lg focus:border-green-400 focus:outline-none transition-colors"
                  :class="customMode ? 'border-green-400 bg-green-50' : ''" />
              </div>
            </div>
            <p v-if="customMode" class="text-sm text-green-600 flex items-center gap-1">
              <span>✨</span>
              使用自定义尺寸: {{ currentRatio }}
            </p>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div
        class="sticky bottom-0 bg-gradient-to-r from-gray-50 to-green-50 p-6 rounded-b-2xl border-t-2 border-green-200">
        <div class="flex gap-3">
          <button @click="closeDialog"
            class="flex-1 px-4 py-2.5 rounded-xl font-semibold border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-100 transition-all duration-200">
            取消
          </button>
          <button @click="applySettings"
            class="flex-1 px-4 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg">
            应用设置
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
