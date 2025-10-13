<template>
  <aside class="w-80 bg-white border-r-2 border-gray-200 p-5 overflow-y-auto">
    <!-- Search Box -->
    <div class="mb-5">
      <input
        v-model="graphStore.searchQuery"
        type="text"
        placeholder="搜索词汇 (例如: dog, happy)"
        class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm transition-all focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        @keypress.enter="handleLoadGraph"
      />
      <button
        :disabled="graphStore.loading"
        class="w-full mt-2 px-4 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        @click="handleLoadGraph"
      >
        {{ graphStore.loading ? '⏳ 加载中...' : '📊 加载词汇图谱' }}
      </button>
    </div>

    <!-- Filters -->
    <div class="mt-6 pt-5 border-t-2 border-gray-100">
      <h3 class="text-sm font-semibold mb-3 text-gray-800">关系类型筛选</h3>
      <div class="space-y-1">
        <label
          v-for="([key, config]) in Object.entries(relationConfig)"
          :key="key"
          class="flex items-center p-2 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <input
            type="checkbox"
            :checked="graphStore.activeRelations.includes(key as RelationType)"
            class="mr-2 w-4 h-4 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
            @change="graphStore.toggleRelation(key as RelationType)"
          />
          <span
            class="w-5 h-0.5 mr-2 rounded"
            :style="{ backgroundColor: config.color }"
          />
          <span class="text-sm text-gray-700">{{ config.label }}</span>
        </label>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useGraphStore } from '@/stores/graphStore'
import { relationConfig } from '@/utils/relationConfig'
import { WordNetService } from '@/services/wordnetService'
import type { RelationType } from '@/types/wordnet'

const graphStore = useGraphStore()

const handleLoadGraph = async () => {
  graphStore.setLoading(true)
  try {
    const data = await WordNetService.fetchWordGraph(graphStore.searchQuery)
    graphStore.setGraphData(data)
  } catch (error) {
    console.error('Failed to load graph:', error)
  } finally {
    graphStore.setLoading(false)
  }
}
</script>
