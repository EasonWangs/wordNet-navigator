<template>
  <div class="relative h-full w-full">
    <div ref="containerRef" class="h-full w-full bg-white" />

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

    <!-- 快速添加词汇对话框 -->
    <div
      v-if="showAddWordDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeAddWordDialog"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">快速添加词汇</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">词汇 <span class="text-red-500">*</span></label>
            <input
              v-model="newWordForm.label"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              placeholder="例如: dog"
              autofocus
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">词性 <span class="text-red-500">*</span></label>
            <select
              v-model="newWordForm.pos"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
            >
              <option v-for="pos in adminStore.posTypes" :key="pos.key" :value="pos.key">
                {{ pos.label }} ({{ pos.key }})
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">定义</label>
            <textarea
              v-model="newWordForm.definition"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              placeholder="词汇的定义"
            />
          </div>
        </div>
        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="closeAddWordDialog"
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            取消
          </button>
          <button
            @click="saveNewWord"
            class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
            :disabled="!newWordForm.label.trim()"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { useAdminStore } from '@/stores/adminStore'
import { useCytoscape } from '@/composables/useCytoscape'
import { WordNetService } from '@/services/wordnetService'
import Legend from './Legend.vue'
import NodeDetail from './NodeDetail.vue'

const graphStore = useGraphStore()
const adminStore = useAdminStore()

// 快速添加词汇对话框
const showAddWordDialog = ref(false)
const newWordForm = ref({
  label: '',
  pos: 'noun',
  definition: '',
})

function openAddWordDialog() {
  showAddWordDialog.value = true
  // 确保 adminStore 已加载数据
  adminStore.loadData()
}

function closeAddWordDialog() {
  showAddWordDialog.value = false
  newWordForm.value = {
    label: '',
    pos: 'noun',
    definition: '',
  }
}

async function saveNewWord() {
  if (!newWordForm.value.label.trim()) {
    alert('请输入词汇')
    return
  }

  try {
    // 添加词汇到数据库
    adminStore.addWord({
      id: `word_${Date.now()}`,
      label: newWordForm.value.label.trim(),
      pos: newWordForm.value.pos as any,
      definition: newWordForm.value.definition.trim() || undefined,
      examples: [],
    })

    // 关闭对话框
    closeAddWordDialog()

    // 刷新图表数据
    const data = await WordNetService.fetchWordGraph(graphStore.searchQuery || '*')
    graphStore.setGraphData(data)
  } catch (error) {
    console.error('Failed to add word:', error)
    alert('添加词汇失败')
  }
}

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
  onBackgroundDblClick: () => openAddWordDialog(),
})

// 导出方法供父组件调用
defineExpose({
  fitView,
  exportPNG,
})
</script>
