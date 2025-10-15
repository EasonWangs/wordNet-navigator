<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <!-- 紧凑的顶部工具栏 -->
    <div class="bg-white border-b border-gray-200 shadow-sm">
      <div class="px-4 py-2 flex items-center gap-4">
        <!-- 标题 -->
        <h1 class="text-lg font-bold text-gray-800 flex-shrink-0">📚 WordNet</h1>

        <!-- 搜索框 -->
        <div class="flex items-center gap-2 flex-1">
          <input
            v-model="graphStore.searchQuery"
            type="text"
            placeholder="搜索词汇 (* 显示全部)"
            class="w-64 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
            @keypress.enter="handleLoadGraph"
          />
          <button
            :disabled="graphStore.loading"
            class="px-4 py-1.5 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleLoadGraph"
          >
            {{ graphStore.loading ? '加载中...' : '搜索' }}
          </button>
        </div>

        <!-- 工具按钮 -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
            @click="fitView"
          >
            适应视图
          </button>
          <button
            class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
            @click="exportPNG"
          >
            导出PNG
          </button>
          <button
            class="px-3 py-1.5 rounded text-sm transition-colors"
            :class="graphStore.showDefinitionInNode
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            @click="graphStore.toggleShowDefinitionInNode()"
            title="在节点内显示定义"
          >
            {{ graphStore.showDefinitionInNode ? '隐藏定义' : '显示定义' }}
          </button>
          <select
            v-model="graphStore.layout"
            class="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white cursor-pointer hover:border-gray-400 transition-colors"
          >
            <option value="cose">力导向</option>
            <option value="circle">圆形</option>
            <option value="grid">网格</option>
            <option value="breadthfirst">层次</option>
          </select>
          <router-link
            to="/admin"
            class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
          >
            管理
          </router-link>
        </div>
      </div>
    </div>

    <!-- 图表显示区域 -->
    <div class="flex-1 overflow-hidden relative">
      <GraphCanvas ref="graphCanvasRef" />
      <!-- 提示文字 -->
      <div class="absolute bottom-4 right-4 bg-gray-800/80 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm space-y-1">
        <div>💡 双击空白区域：快速添加词汇</div>
        <div>✏️ 双击节点：编辑词汇信息</div>
        <div>🔗 选中两个节点：创建词汇关系</div>
        <div>⚡ 双击关系线：编辑关系</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { WordNetService } from '@/services/wordnetService'
import GraphCanvas from '@/components/GraphCanvas.vue'

const graphStore = useGraphStore()
const graphCanvasRef = ref<InstanceType<typeof GraphCanvas> | null>(null)

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

const fitView = () => {
  // 通过 GraphCanvas 的 ref 调用 fitView
  if (graphCanvasRef.value) {
    (graphCanvasRef.value as any).fitView()
  }
}

const exportPNG = () => {
  // 通过 GraphCanvas 的 ref 调用 exportPNG
  if (graphCanvasRef.value) {
    (graphCanvasRef.value as any).exportPNG()
  }
}

onMounted(async () => {
  graphStore.setLoading(true)
  try {
    // Load all words initially (use '*' to show all)
    const data = await WordNetService.fetchWordGraph('*')
    graphStore.setGraphData(data)
  } catch (error) {
    console.error('Failed to load initial data:', error)
  } finally {
    graphStore.setLoading(false)
  }
})
</script>
