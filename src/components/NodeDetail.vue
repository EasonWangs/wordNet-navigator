<template>
  <div
    v-if="graphStore.selectedNode"
    class="absolute top-5 right-5 w-80 max-h-[calc(100%-2.5rem)] bg-white/60 backdrop-blur-md shadow-2xl z-50 overflow-y-auto transition-all duration-300 rounded-lg border border-white/50"
    :class="{ 'translate-x-0 opacity-100': graphStore.selectedNode, 'translate-x-full opacity-0': !graphStore.selectedNode }"
  >
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-500/60 to-purple-500/60 backdrop-blur-sm text-white px-4 py-3 flex justify-between items-center sticky top-0 z-10">
      <h2 class="text-base font-bold">节点详情</h2>
      <button
        class="w-7 h-7 bg-white/20 rounded-full text-xl leading-none hover:bg-white/30 transition-all hover:rotate-90 duration-200"
        @click="graphStore.setSelectedNode(null)"
      >
        ×
      </button>
    </div>

    <!-- Content -->
    <div v-if="graphStore.selectedNode" class="p-4">
      <!-- Word Title -->
      <div class="mb-4">
        <div class="text-2xl font-bold text-gray-800 mb-2">
          {{ graphStore.selectedNode.label }}
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(posItem, idx) in getPosArray(graphStore.selectedNode.pos)"
            :key="idx"
            class="inline-block px-2.5 py-1 bg-blue-100/80 text-blue-700 rounded-full text-xs font-semibold"
            :title="posItem"
          >
            {{ getPosLabel(posItem) }}
          </span>
        </div>
      </div>

      <!-- Definition -->
      <div v-if="graphStore.selectedNode.definition" class="mb-4">
        <h3 class="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">📖 定义</h3>
        <p class="text-gray-700 leading-relaxed bg-gray-50/50 p-3 rounded-md">{{ graphStore.selectedNode.definition }}</p>
      </div>

      <!-- Examples -->
      <div v-if="graphStore.selectedNode.examples?.length" class="mb-4">
        <h3 class="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">💬 例句</h3>
        <ul class="space-y-2">
          <li
            v-for="(example, i) in graphStore.selectedNode.examples"
            :key="i"
            class="text-gray-700 text-sm italic pl-3 py-2 border-l-3 border-blue-300/60 bg-gray-50/30 rounded-r"
          >
            "{{ example }}"
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGraphStore } from '@/stores/graphStore'
import { useAdminStore } from '@/stores/adminStore'

const graphStore = useGraphStore()
const adminStore = useAdminStore()

// 将 pos 转换为数组（兼容单个和多个词性）
function getPosArray(pos: any): string[] {
  if (Array.isArray(pos)) {
    return pos
  }
  return [pos]
}

// 获取词性显示标签（带缩写）
function getPosLabel(posKey: string): string {
  const posType = adminStore.posTypes.find(pt => pt.key === posKey)
  if (posType) {
    return posType.abbreviation ? posType.abbreviation : posType.label
  }
  return posKey
}
</script>
