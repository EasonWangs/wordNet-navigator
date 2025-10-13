<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <div class="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-4 shadow-md flex items-center justify-between">
      <h1 class="text-2xl font-bold">📚 WordNet 可视化</h1>
      <router-link
        to="/admin"
        class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md text-sm font-medium transition-colors"
      >
        数据管理
      </router-link>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <Sidebar />
      <GraphCanvas />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { WordNetService } from '@/services/wordnetService'
import Sidebar from '@/components/Sidebar.vue'
import GraphCanvas from '@/components/GraphCanvas.vue'

const graphStore = useGraphStore()

onMounted(async () => {
  graphStore.setLoading(true)
  try {
    const data = await WordNetService.fetchWordGraph('dog')
    graphStore.setGraphData(data)
  } catch (error) {
    console.error('Failed to load initial data:', error)
  } finally {
    graphStore.setLoading(false)
  }
})
</script>
