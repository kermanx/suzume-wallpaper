<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { generateDensity, generateSizeVariation } from './logic'

const show = defineModel<boolean>()

// 预设配置选项
const presetConfigs = [
  { name: '稀疏分布', density: 10, sizeVariation: 0.8, description: '较少图片，更大间距' },
  { name: '标准配置', density: 20, sizeVariation: 1.0, description: '默认密度和大小' },
  { name: '密集分布', density: 50, sizeVariation: 1.2, description: '更多图片，较小间距' },
  { name: '极密集', density: 80, sizeVariation: 0.6, description: '密集排列，尺寸统一' },
  { name: '混乱风格', density: 30, sizeVariation: 2.0, description: '中等密度，大小差异明显' },
]

// 临时设置值
const selectedDensity = ref(generateDensity.value)
const selectedSizeVariation = ref(generateSizeVariation.value)

watch(show, (newValue) => {
  if (newValue) {
    selectedDensity.value = generateDensity.value
    selectedSizeVariation.value = generateSizeVariation.value
  }
})

// 选择预设配置
const selectPreset = (preset: typeof presetConfigs[0]) => {
  selectedDensity.value = preset.density
  selectedSizeVariation.value = preset.sizeVariation
}

// 应用设置
const applySettings = () => {
  generateDensity.value = selectedDensity.value
  generateSizeVariation.value = selectedSizeVariation.value
  show.value = false
}

// 关闭对话框
const closeDialog = () => {
  selectedDensity.value = generateDensity.value
  selectedSizeVariation.value = generateSizeVariation.value
  show.value = false
}

// 密度描述
const densityDescription = computed(() => {
  if (selectedDensity.value < 15) return '稀疏'
  if (selectedDensity.value <= 30) return '适中'
  if (selectedDensity.value < 80) return '密集'
  return '极密集'
})

// 大小变化描述
const sizeVariationDescription = computed(() => {
  if (selectedSizeVariation.value < 0.8) return '大小统一'
  if (selectedSizeVariation.value < 1.2) return '轻微变化'
  if (selectedSizeVariation.value < 1.6) return '明显变化'
  return '极大变化'
})
</script>

<template>
  <!-- 遮罩层 -->
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- 背景遮罩 -->
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeDialog"></div>

    <!-- 对话框 -->
    <div
      class="flex flex-col relative bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl shadow-blue-500/20 border-2 border-blue-200 max-w-md w-full h-[80vh] md:h-[80vh] h-[90vh]">
      <!-- 头部 -->
      <div class="flex-shrink-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 md:p-6 rounded-t-2xl">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <span class="text-2xl">🎨</span>
            生成设置
          </h2>
          <button @click="closeDialog" class="p-1 hover:bg-white/20 rounded-full transition-colors">
            <span class="text-xl">✕</span>
          </button>
        </div>
      </div>

      <!-- 当前设置显示 -->
      <!-- <div class="flex-shrink-0 p-4 pb-0 md:p-6 md:pb-0 hidden md:block">
        <div class="bg-gradient-to-r from-blue-100 to-indigo-100 p-4 rounded-xl border-2 border-blue-200">
          <div class="text-center">
            <p class="text-blue-700 font-semibold mb-2">当前生成设置</p>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p class="text-blue-600 font-medium">密度</p>
                <p class="text-lg font-bold text-blue-800">{{ selectedDensity }}</p>
                <p class="text-xs text-blue-600">{{ densityDescription }}</p>
              </div>
              <div>
                <p class="text-blue-600 font-medium">大小变化</p>
                <p class="text-lg font-bold text-blue-800">{{ selectedSizeVariation.toFixed(1) }}</p>
                <p class="text-xs text-blue-600">{{ sizeVariationDescription }}</p>
              </div>
            </div>
          </div>
        </div>
      </div> -->

      <!-- 预设配置选择 -->
      <div class="flex-1 flex flex-col p-4 py-2 md:p-6 md:py-4 min-h-0">
        <h3 class="flex-shrink-0 text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span class="text-xl">🎯</span>
          预设配置
        </h3>
        <div class="flex-1 overflow-y-auto">
          <div class="grid grid-cols-1 gap-2">
            <button v-for="preset in presetConfigs" :key="preset.name" @click="selectPreset(preset)"
              class="p-3 text-left rounded-xl border-2 transition-all duration-200 hover:shadow-md" :class="selectedDensity === preset.density && selectedSizeVariation === preset.sizeVariation
                ? 'border-blue-400 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 shadow-md'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-gray-700'">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <p class="font-semibold">{{ preset.name }}</p>
                  <p class="text-xs opacity-75 mt-1">{{ preset.description }}</p>
                  <div class="flex gap-2 mt-2 text-xs">
                    <span class="px-2 py-1 bg-gray-100 rounded-full">密度: {{ preset.density }}</span>
                    <span class="px-2 py-1 bg-gray-100 rounded-full">变化: {{ preset.sizeVariation }}</span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- 自定义设置 -->
      <div class="flex-shrink-0 px-4 pb-2 md:px-6 md:pb-4">
        <h3 class="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span class="text-xl">🔧</span>
          自定义设置
        </h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-2">
              密度: {{ selectedDensity }} ({{ densityDescription }})
            </label>
            <input v-model.number="selectedDensity" type="range" min="5" max="100" step="1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider" />
            <div class="flex text-xs text-gray-500 mt-1">
              <div>稀疏 (5)</div>
              <div flex-grow-2 />
              <div>适中 (20)</div>
              <div flex-grow-80 />
              <div>极密集 (100)</div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-2">
              大小变化: {{ selectedSizeVariation.toFixed(1) }} ({{ sizeVariationDescription }})
            </label>
            <input v-model.number="selectedSizeVariation" type="range" min="0.5" max="2.0" step="0.1"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider" />
            <div class="flex text-xs text-gray-500 mt-1">
              <span>统一 (0.5)</span>
              <div flex-grow-14 />
              <span>标准 (1.0)</span>
              <div flex-grow-40 />
              <span>极变化 (2.0)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div
        class="flex-shrink-0 bg-gradient-to-r from-gray-50 to-blue-50 p-4 md:p-6 rounded-b-2xl border-t-2 border-blue-200">
        <div class="flex gap-3">
          <button @click="closeDialog"
            class="flex-1 px-4 py-2.5 rounded-xl font-semibold border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-100 transition-all duration-200">
            取消
          </button>
          <button @click="applySettings"
            class="flex-1 px-4 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-md hover:shadow-lg">
            确定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: 0;
}
</style>
