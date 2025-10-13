<template>
  <div class="absolute bottom-5 left-5 bg-white/60 backdrop-blur-md px-4 py-3 rounded-lg shadow-xl z-10 border border-white/50">
    <h4 class="text-sm font-semibold mb-2 text-gray-800">关系类型筛选</h4>
    <div class="space-y-1.5">
      <label
        v-for="([key, config]) in Object.entries(relationConfig)"
        :key="key"
        class="flex items-center text-sm cursor-pointer hover:bg-white/60 rounded px-2 py-1 transition-all"
      >
        <input
          type="checkbox"
          :checked="graphStore.activeRelations.includes(key as RelationType)"
          class="mr-2 w-3.5 h-3.5 text-blue-500 rounded cursor-pointer"
          @change="graphStore.toggleRelation(key as RelationType)"
        />
        <span
          class="w-5 h-0.5 mr-2 rounded transition-opacity"
          :style="{
            backgroundColor: config.color,
            opacity: graphStore.activeRelations.includes(key as RelationType) ? 1 : 0.3
          }"
        />
        <span
          class="transition-opacity font-medium"
          :class="graphStore.activeRelations.includes(key as RelationType) ? 'text-gray-700' : 'text-gray-400'"
        >
          {{ config.label }}
        </span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGraphStore } from '@/stores/graphStore'
import { relationConfig } from '@/utils/relationConfig'
import type { RelationType } from '@/types/wordnet'

const graphStore = useGraphStore()
</script>
