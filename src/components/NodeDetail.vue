<template>
  <div
    v-if="graphStore.selectedNode"
    class="absolute top-0 right-0 w-96 h-full bg-white shadow-xl z-50 overflow-y-auto transition-transform duration-300"
    :class="{ 'translate-x-0': graphStore.selectedNode, 'translate-x-full': !graphStore.selectedNode }"
  >
    <!-- Header -->
    <div
      class="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-5 py-5 flex justify-between items-center"
    >
      <h2 class="text-lg font-bold">节点详情</h2>
      <button
        class="w-8 h-8 bg-white/20 rounded-full text-2xl leading-none hover:bg-white/30 transition-all hover:rotate-90 duration-200"
        @click="graphStore.setSelectedNode(null)"
      >
        ×
      </button>
    </div>

    <!-- Content -->
    <div v-if="graphStore.selectedNode" class="p-5">
      <!-- Word Title -->
      <div class="mb-5">
        <div class="text-3xl font-bold text-gray-800 mb-2">
          {{ graphStore.selectedNode.label }}
        </div>
        <span
          class="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold uppercase"
        >
          {{ graphStore.selectedNode.pos }}
        </span>
      </div>

      <!-- Definition -->
      <div v-if="graphStore.selectedNode.definition" class="mb-5">
        <h3 class="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">📖 定义</h3>
        <p class="text-gray-700 leading-relaxed">{{ graphStore.selectedNode.definition }}</p>
      </div>

      <!-- Examples -->
      <div v-if="graphStore.selectedNode.examples?.length" class="mb-5">
        <h3 class="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">💬 例句</h3>
        <ul class="space-y-2">
          <li
            v-for="(example, i) in graphStore.selectedNode.examples"
            :key="i"
            class="text-gray-700 italic pl-4 border-l-2 border-gray-200"
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

const graphStore = useGraphStore()
</script>
