<template>
  <div class="bg-white px-4 py-3 border-b-2 border-gray-200 flex gap-3 items-center">
    <button
      class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
      @click="$emit('fitView')"
    >
      🔍 适应视图 / 正常大小
    </button>
    <button
      class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
      @click="$emit('exportPNG')"
    >
      📷 导出PNG
    </button>
    <select
      v-model="graphStore.layout"
      class="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      <option value="cose">力导向布局</option>
      <option value="circle">圆形布局</option>
      <option value="grid">网格布局</option>
      <option value="breadthfirst">层次布局</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { useGraphStore } from '@/stores/graphStore'

defineEmits<{
  fitView: []
  exportPNG: []
}>()

const graphStore = useGraphStore()
</script>
