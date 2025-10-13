<template>
  <div class="flex-1 flex flex-col relative">
    <Toolbar @fit-view="fitView" @export-p-n-g="exportPNG" />

    <div ref="containerRef" class="flex-1 bg-white" />

    <div
      v-if="graphStore.loading"
      class="absolute inset-0 flex items-center justify-center bg-white/80"
    >
      <div class="text-center">
        <div
          class="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"
        />
        <p class="text-gray-600">加载中...</p>
      </div>
    </div>

    <Legend />
    <NodeDetail />
  </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { useCytoscape } from '@/composables/useCytoscape'
import Toolbar from './Toolbar.vue'
import Legend from './Legend.vue'
import NodeDetail from './NodeDetail.vue'

const graphStore = useGraphStore()

// 使用 toRef 创建响应式引用
const graphDataRef = toRef(graphStore, 'graphData')
const activeRelationsRef = toRef(graphStore, 'activeRelations')
const layoutRef = toRef(graphStore, 'layout')

const { containerRef, fitView, exportPNG } = useCytoscape({
  get graphData() {
    return graphDataRef.value
  },
  get activeRelations() {
    return activeRelationsRef.value
  },
  get layout() {
    return layoutRef.value
  },
  onNodeClick: (nodeData) => graphStore.setSelectedNode(nodeData),
})
</script>
