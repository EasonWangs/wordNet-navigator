<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <!-- 紧凑的顶部工具栏 -->
    <div class="bg-white border-b border-gray-200 shadow-sm">
      <div class="px-4 py-2 flex items-center gap-4">
        <!-- 标题 -->
        <h1 class="text-lg font-bold text-gray-800 flex-shrink-0">📚 WordNet</h1>

        <!-- 搜索框 -->
        <div class="flex items-center gap-2 flex-1 relative">
          <div class="relative">
            <input
              ref="searchInputRef"
              v-model="graphStore.searchQuery"
              type="text"
              placeholder="搜索词汇 (* 显示全部)"
              class="w-64 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              @focus="handleSearchFocus"
              @blur="handleSearchBlur"
              @keypress.enter="handleLoadGraph"
            />

            <!-- 搜索历史下拉框 -->
            <div
              v-if="showSearchHistory && searchHistory.length > 0"
              class="absolute top-full left-0 w-64 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto"
            >
              <div class="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-600 font-semibold">
                🕐 最近搜索
              </div>
              <div
                v-for="(item, index) in searchHistory"
                :key="index"
                class="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm flex items-center justify-between group"
                @click="handleHistoryItemClick(item.word)"
              >
                <span class="text-gray-700">{{ item.word }}</span>
                <svg class="w-4 h-4 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </div>

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
            🔍 {{ fitViewButtonLabel }}
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
            title="在节点内显示定义"
            @click="graphStore.toggleShowDefinitionInNode()"
          >
            {{ graphStore.showDefinitionInNode ? '隐藏定义' : '显示定义' }}
          </button>
          <select
            :value="graphStore.layout"
            class="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white cursor-pointer hover:border-gray-400 transition-colors"
            @change="handleLayoutChange"
          >
            <option value="cose">力导向</option>
            <option value="circle">圆形</option>
            <option value="grid">网格</option>
            <option value="breadthfirst">层次</option>
          </select>
          <select
            :value="graphStore.relationDepth"
            class="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white cursor-pointer hover:border-gray-400 transition-colors"
            title="关系层级深度"
            @change="handleDepthChange"
          >
            <option :value="1">1层关系</option>
            <option :value="2">2层关系</option>
            <option :value="3">3层关系</option>
            <option :value="4">4层关系</option>
            <option :value="5">5层关系</option>
          </select>
          <select
            :value="graphStore.maxNodes"
            class="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white cursor-pointer hover:border-gray-400 transition-colors"
            title="最大节点数量"
            @change="handleMaxNodesChange"
          >
            <option :value="20">20个节点</option>
            <option :value="50">50个节点</option>
            <option :value="100">100个节点</option>
            <option :value="200">200个节点</option>
            <option :value="500">500个节点</option>
            <option :value="1000">1000个节点</option>
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

      <!-- 节点详情面板 -->
      <NodeDetail @edit="handleNodeEdit" />

      <!-- 性能统计信息 -->
      <div v-if="graphStore.graphData.nodes.length > 0" class="absolute top-4 left-4 bg-blue-500/90 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm">
        <div class="font-semibold">📊 当前显示</div>
        <div>节点: {{ graphStore.graphData.nodes.length }} / {{ graphStore.maxNodes }} 个</div>
        <div>关系: {{ graphStore.graphData.edges.length }} 条</div>
        <div>深度: {{ graphStore.relationDepth }} 层</div>
      </div>

      <!-- 提示文字 -->
      <div class="absolute bottom-4 right-4 bg-gray-800/80 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm space-y-1">
        <div>👆 单击节点：查看详情</div>
        <div>🖱️ 右键单击节点：编辑词汇</div>
        <div>🔍 双击节点：搜索该词汇</div>
        <div>💡 双击空白区域：快速添加词汇</div>
        <div>🔗 按Ctrl/Cmd选中两个节点：创建关系</div>
        <div>⚡ 双击关系线：编辑关系</div>
        <div>🗑️ 选中节点/关系后按Delete键：删除</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, unref } from 'vue'
import type { Ref as VueRef } from 'vue'
import { useRoute } from 'vue-router'
import type { LocationQueryValue } from 'vue-router'
import { useGraphStore } from '@/stores/graphStore'
import { WordNetService } from '@/services/wordnetService'
import GraphCanvas from '@/components/GraphCanvas.vue'
import NodeDetail from '@/components/NodeDetail.vue'
import type { LayoutType, WordNode } from '@/types/wordnet'
import { getSearchHistory, addSearchHistory, type SearchHistoryItem } from '@/utils/searchHistory'

const graphStore = useGraphStore()
const route = useRoute()

// 搜索历史相关
const showSearchHistory = ref(false)
const searchHistory = ref<SearchHistoryItem[]>([])
const searchInputRef = ref<HTMLInputElement | null>(null)

interface GraphCanvasExposed {
  fitView: () => void
  exportPNG: () => void
  isFitModeActive: VueRef<boolean>
  openEditWordDialog: (nodeData: any) => void
}

const graphCanvasRef = ref<GraphCanvasExposed | null>(null)
const fitViewButtonLabel = ref('适应视图')

const syncFitViewLabel = () => {
  const fitModeRef = graphCanvasRef.value?.isFitModeActive
  const isFit = fitModeRef !== undefined ? unref(fitModeRef) : true
  fitViewButtonLabel.value = isFit ? '适应视图' : '正常大小'
}

// 处理节点详情面板的编辑事件
const handleNodeEdit = (nodeData: any) => {
  if (graphCanvasRef.value && graphCanvasRef.value.openEditWordDialog) {
    graphCanvasRef.value.openEditWordDialog(nodeData)
  }
}

// 处理搜索框获得焦点事件
const handleSearchFocus = () => {
  // 清空搜索框
  graphStore.setSearchQuery('')
  // 加载搜索历史
  searchHistory.value = getSearchHistory()
  // 显示下拉框
  showSearchHistory.value = true
}

// 处理搜索框失去焦点事件
const handleSearchBlur = () => {
  // 延迟关闭，以便点击历史项时能触发
  setTimeout(() => {
    showSearchHistory.value = false
  }, 200)
}

// 点击历史项
const handleHistoryItemClick = (word: string) => {
  graphStore.setSearchQuery(word)
  showSearchHistory.value = false
  handleLoadGraph()
}

const handleLoadGraph = async () => {
  const query = graphStore.searchQuery.trim()

  // 保存到搜索历史
  if (query && query !== '*') {
    addSearchHistory(query)
  }

  graphStore.setLoading(true)
  try {
    const data = await WordNetService.fetchWordGraph(
      query,
      graphStore.relationDepth,
      graphStore.maxNodes
    )
    graphStore.setGraphData(data)
  } catch (error) {
    console.error('Failed to load graph:', error)
  } finally {
    graphStore.setLoading(false)
  }
}

const fitView = () => {
  if (!graphCanvasRef.value) return
  graphCanvasRef.value.fitView()
  syncFitViewLabel()
}

const exportPNG = () => {
  // 通过 GraphCanvas 的 ref 调用 exportPNG
  graphCanvasRef.value?.exportPNG()
}

const handleLayoutChange = (e: Event) => {
  // 更新布局算法并保存到 cookie
  const target = e.target as HTMLSelectElement
  graphStore.setLayout(target.value as LayoutType)
}

const handleDepthChange = async (e: Event) => {
  // 更新关系层级深度并保存到 cookie
  const target = e.target as HTMLSelectElement
  graphStore.setRelationDepth(Number(target.value))
  // 深度变化时重新加载图谱
  await handleLoadGraph()
}

const handleMaxNodesChange = async (e: Event) => {
  // 更新最大节点数并保存到 cookie
  const target = e.target as HTMLSelectElement
  graphStore.setMaxNodes(Number(target.value))
  // 最大节点数变化时重新加载图谱
  await handleLoadGraph()
}

const getKeywordFromQuery = (
  value: LocationQueryValue | LocationQueryValue[] | null | undefined
) => {
  if (Array.isArray(value)) {
    return (value[0] ?? '').trim()
  }
  return typeof value === 'string' ? value.trim() : ''
}

const loadAllWords = async () => {
  graphStore.setLoading(true)
  try {
    const data = await WordNetService.fetchWordGraph(
      '*',
      graphStore.relationDepth,
      graphStore.maxNodes
    )
    graphStore.setGraphData(data)
  } catch (error) {
    console.error('Failed to load all words:', error)
  } finally {
    graphStore.setLoading(false)
  }
}

const searchByKeyword = async (keyword: string) => {
  if (!keyword) return
  graphStore.setSearchQuery(keyword)
  await handleLoadGraph()
}

const shouldAutoSelectKeyword = (keyword: string) => {
  const trimmed = keyword.trim()
  return trimmed !== '' && trimmed !== '*'
}

const findNodeForKeyword = (keyword: string): WordNode | null => {
  if (!shouldAutoSelectKeyword(keyword)) {
    return null
  }

  const normalizedKeyword = keyword.trim().toLowerCase()
  if (!normalizedKeyword) {
    return null
  }

  const candidateNodes = graphStore.graphData.nodes
    .map(node => node.data)
    .filter(node => Boolean(node?.label) && !node?.isMoreNode)

  const isExactMatch = (node: WordNode) =>
    node.label.trim().toLowerCase() === normalizedKeyword

  const centerMatch = candidateNodes.find(node => node.isCenter && isExactMatch(node))
  if (centerMatch) return centerMatch

  const exactMatch = candidateNodes.find(isExactMatch)
  if (exactMatch) return exactMatch

  return candidateNodes.find(node =>
    node.label.trim().toLowerCase().includes(normalizedKeyword)
  ) ?? null
}

const autoSelectNodeForSearch = (keyword: string) => {
  if (!shouldAutoSelectKeyword(keyword)) {
    graphStore.setSelectedNode(null)
    return
  }

  const targetNode = findNodeForKeyword(keyword)
  graphStore.setSelectedNode(targetNode ?? null)
}

// 注意：已移除实时搜索功能
// 用户需要手动点击"搜索"按钮或按回车键触发搜索
// 这样可以避免输入时频繁触发搜索，提升用户体验

onMounted(async () => {
  const keyword = getKeywordFromQuery(route.query.keyword)
  if (keyword) {
    await searchByKeyword(keyword)
    return
  }

  await loadAllWords()
})

watch(
  () => route.query.keyword,
  (newValue, oldValue) => {
    const newKeyword = getKeywordFromQuery(newValue)
    const previousKeyword = getKeywordFromQuery(oldValue)

    if (newKeyword === previousKeyword) {
      return
    }

    if (newKeyword) {
      void searchByKeyword(newKeyword)
    } else if (previousKeyword) {
      graphStore.setSearchQuery('')
      void loadAllWords()
    }
  }
)

watch(
  () => graphStore.graphVersion,
  () => {
    autoSelectNodeForSearch(graphStore.searchQuery || '')
  },
  { immediate: true }
)

watch(
  () => {
    const canvasRef = graphCanvasRef.value
    return canvasRef?.isFitModeActive ? unref(canvasRef.isFitModeActive) : undefined
  },
  () => {
    syncFitViewLabel()
  },
  { immediate: true }
)
</script>
