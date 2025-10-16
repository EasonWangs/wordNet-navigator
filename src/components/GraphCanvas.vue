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

    <!-- 快速创建/编辑关系按钮 (当选中2个节点时显示) -->
    <div
      v-if="selectedNodes.length === 2"
      class="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 flex items-center gap-3 border border-gray-200 z-40"
    >
      <div class="flex items-center gap-2 text-sm">
        <span class="font-medium text-gray-700">{{ selectedNodes[0].label }}</span>
        <span class="text-gray-400">→</span>
        <span class="font-medium text-gray-700">{{ selectedNodes[1].label }}</span>
        <span v-if="existingRelations.length > 0" class="text-xs text-green-600 ml-2">
          (已有 {{ existingRelations.length }} 个关系)
        </span>
      </div>
      <button
        @click="openCreateRelationDialog"
        class="px-4 py-1.5 bg-primary-500 text-white rounded text-sm hover:bg-primary-600 transition-colors"
      >
        {{ existingRelations.length > 0 ? '编辑关系' : '创建关系' }}
      </button>
      <button
        @click="clearSelection"
        class="px-2 py-1.5 text-gray-500 hover:text-gray-700 transition-colors"
        title="清除选择"
      >
        ✕
      </button>
    </div>

    <!-- 快速添加/编辑词汇对话框 -->
    <div
      v-if="showAddWordDialog || showEditWordDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeWordDialog"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">{{ showEditWordDialog ? '编辑词汇' : '快速添加词汇' }}</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">词汇 <span class="text-red-500">*</span></label>
            <input
              v-model="wordForm.label"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              placeholder="例如: dog"
              autofocus
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">词性（可多选）</label>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="pos in adminStore.posTypes"
                :key="pos.key"
                class="flex items-center px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                :class="{
                  'border-primary-500 bg-primary-50': isPosSelected(pos.key),
                  'border-gray-300': !isPosSelected(pos.key)
                }"
              >
                <input
                  type="checkbox"
                  :value="pos.key"
                  v-model="wordForm.pos"
                  class="mr-2"
                />
                <span class="text-sm">
                  {{ pos.label }}
                  <span v-if="pos.abbreviation" class="text-gray-500 ml-1">({{ pos.abbreviation }})</span>
                </span>
              </label>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">定义</label>
            <textarea
              v-model="wordForm.definition"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              placeholder="词汇的定义"
            />
          </div>
          <div v-if="showEditWordDialog">
            <label class="block text-sm font-medium text-gray-700 mb-1">例句</label>
            <div v-for="(example, index) in wordForm.examples" :key="index" class="flex mb-2">
              <input
                v-model="wordForm.examples[index]"
                type="text"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-primary-500"
                placeholder="输入例句"
              />
              <button
                @click="removeExample(index)"
                class="px-3 py-2 bg-red-500 text-white rounded-r-md hover:bg-red-600"
              >
                删除
              </button>
            </div>
            <button
              @click="addExample"
              class="mt-2 text-sm text-primary-600 hover:text-primary-800"
            >
              + 添加例句
            </button>
          </div>
        </div>
        <div class="mt-6 flex items-center justify-between">
          <!-- 左侧删除按钮（仅在编辑模式且无关系时显示） -->
          <button
            v-if="showEditWordDialog && isIsolatedWord"
            @click="deleteWord"
            class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-300"
            title="删除独立节点"
          >
            删除词汇
          </button>
          <div v-else></div>

          <!-- 右侧操作按钮 -->
          <div class="flex space-x-3">
            <button
              @click="closeWordDialog"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              取消
            </button>
            <button
              @click="saveWord"
              class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
              :disabled="!wordForm.label.trim()"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑关系对话框 -->
    <div
      v-if="showCreateRelationDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeCreateRelationDialog"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">
          {{ existingRelations.length > 0 ? '编辑词汇关系' : '创建词汇关系' }}
        </h3>
        <div class="mb-4 p-3 bg-gray-50 rounded-md">
          <div class="flex items-center gap-2 text-sm">
            <span class="font-medium text-gray-700">{{ selectedNodes[0]?.label }}</span>
            <span class="text-gray-400">→</span>
            <span class="font-medium text-gray-700">{{ selectedNodes[1]?.label }}</span>
          </div>
        </div>

        <!-- 已存在的关系 -->
        <div v-if="existingRelations.length > 0" class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">已存在的关系</label>
          <div class="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div
              v-for="relation in existingRelations"
              :key="relation.id"
              class="flex items-center justify-between p-2 bg-white rounded"
            >
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium">{{ getRelationLabel(relation.relation) }}</span>
                <span class="text-xs text-gray-500">({{ relation.relation }})</span>
              </div>
              <button
                @click="deleteRelation(relation.id)"
                class="text-xs text-red-600 hover:text-red-800"
              >
                删除
              </button>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ existingRelations.length > 0 ? '添加新关系类型' : '选择关系类型' }}
              <span class="text-red-500">*</span>
            </label>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <label
                v-for="relationType in availableRelationTypes"
                :key="relationType.key"
                class="flex items-start p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                :class="{
                  'border-primary-500 bg-primary-50': newRelationForm.relationType === relationType.key,
                  'opacity-50 cursor-not-allowed': isRelationExists(relationType.key)
                }"
              >
                <input
                  type="radio"
                  :value="relationType.key"
                  v-model="newRelationForm.relationType"
                  class="mt-1 mr-3"
                  :disabled="isRelationExists(relationType.key)"
                />
                <div class="flex-1">
                  <div class="font-medium text-sm">
                    {{ relationType.label }}
                    <span v-if="isRelationExists(relationType.key)" class="text-xs text-gray-500 ml-2">(已存在)</span>
                  </div>
                  <div v-if="relationType.description" class="text-xs text-gray-500 mt-0.5">{{ relationType.description }}</div>
                  <div v-if="relationType.pairWith" class="text-xs text-green-600 mt-1">
                    ↔ 将自动创建反向关系: {{ getRelationLabel(relationType.pairWith) }}
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="closeCreateRelationDialog"
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            {{ existingRelations.length > 0 ? '完成' : '取消' }}
          </button>
          <button
            v-if="newRelationForm.relationType"
            @click="saveRelation"
            class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            {{ existingRelations.length > 0 ? '添加' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, toRef, computed } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { useAdminStore } from '@/stores/adminStore'
import { useCytoscape } from '@/composables/useCytoscape'
import { WordNetService } from '@/services/wordnetService'
import Legend from './Legend.vue'
import NodeDetail from './NodeDetail.vue'

const graphStore = useGraphStore()
const adminStore = useAdminStore()

// 选中的节点
const selectedNodes = ref<any[]>([])

// 已存在的关系
const existingRelations = ref<any[]>([])

// 添加/编辑词汇对话框
const showAddWordDialog = ref(false)
const showEditWordDialog = ref(false)
const editingWordId = ref<string | null>(null)
const wordForm = ref({
  label: '',
  pos: [] as string[],  // 改为数组支持多选
  definition: '',
  examples: [] as string[],
})

// 创建关系对话框
const showCreateRelationDialog = ref(false)
const newRelationForm = ref({
  relationType: '',
})

function openAddWordDialog() {
  showAddWordDialog.value = true
  showEditWordDialog.value = false
  editingWordId.value = null
  wordForm.value = {
    label: '',
    pos: [],  // 默认不选中任何词性
    definition: '',
    examples: [],
  }
  // 确保 adminStore 已加载数据
  adminStore.loadData()
}

function openEditWordDialog(nodeData: any) {
  showEditWordDialog.value = true
  showAddWordDialog.value = false
  editingWordId.value = nodeData.id

  // 关闭词汇详情面板
  graphStore.setSelectedNode(null)

  // 从 adminStore 获取完整的词汇数据
  adminStore.loadData()
  const word = adminStore.words.find(w => w.id === nodeData.id)

  if (word) {
    wordForm.value = {
      label: word.label,
      pos: Array.isArray(word.pos) ? [...word.pos] : (word.pos ? [word.pos] : []),  // 兼容单个、数组或未定义
      definition: word.definition || '',
      examples: word.examples ? [...word.examples] : [],
    }
  }
}

function closeWordDialog() {
  showAddWordDialog.value = false
  showEditWordDialog.value = false
  editingWordId.value = null
  wordForm.value = {
    label: '',
    pos: [],
    definition: '',
    examples: [],
  }
}

// 检查词性是否被选中
function isPosSelected(posKey: string): boolean {
  return Array.isArray(wordForm.value.pos) && wordForm.value.pos.includes(posKey)
}

// 检查当前编辑的词汇是否是独立节点（无任何关系）
const isIsolatedWord = computed(() => {
  if (!showEditWordDialog.value || !editingWordId.value) return false

  const wordId = editingWordId.value
  const hasConnections = adminStore.connections.some(
    c => c.source === wordId || c.target === wordId
  )

  return !hasConnections
})

// 删除词汇
async function deleteWord() {
  if (!editingWordId.value) return

  if (!confirm('确定要删除这个词汇吗？此操作无法撤销。')) {
    return
  }

  try {
    const wordId = editingWordId.value

    // 从 adminStore 删除词汇
    adminStore.deleteWord(wordId)

    // 关闭对话框
    closeWordDialog()

    // 刷新图表数据
    const data = await WordNetService.fetchWordGraph(graphStore.searchQuery || '*')
    graphStore.setGraphData(data)
  } catch (error) {
    console.error('Failed to delete word:', error)
    alert('删除词汇失败')
  }
}

function addExample() {
  wordForm.value.examples.push('')
}

function removeExample(index: number) {
  wordForm.value.examples.splice(index, 1)
}

async function saveWord() {
  if (!wordForm.value.label.trim()) {
    alert('请输入词汇')
    return
  }

  // 词性改为可选，但如果填写了则需要至少选择一个
  let posValue: string | string[] | undefined
  if (Array.isArray(wordForm.value.pos) && wordForm.value.pos.length > 0) {
    // 单个词性保存为字符串，多个保存为数组（向后兼容）
    posValue = wordForm.value.pos.length === 1 ? wordForm.value.pos[0] : wordForm.value.pos
  } else {
    posValue = undefined  // 未选择词性时设为 undefined
  }

  try {
    if (showEditWordDialog.value && editingWordId.value) {
      // 编辑模式 - 只更新本地数据，不重新加载图表
      const updatedData = {
        label: wordForm.value.label.trim(),
        pos: posValue,
        definition: wordForm.value.definition.trim() || undefined,
        examples: wordForm.value.examples.filter(e => e.trim()),
      }

      // 更新 LocalStorage
      adminStore.updateWord(editingWordId.value, updatedData)

      // 直接更新 Cytoscape 节点数据，不触发重新渲染
      if (updateNodeData) {
        updateNodeData(editingWordId.value, updatedData)
      }

      // 更新 graphStore 中的数据（用于其他地方可能需要读取）
      const nodeIndex = graphStore.graphData.nodes.findIndex(n => n.data.id === editingWordId.value)
      if (nodeIndex !== -1) {
        graphStore.graphData.nodes[nodeIndex].data = {
          ...graphStore.graphData.nodes[nodeIndex].data,
          ...updatedData
        }
      }
    } else {
      // 添加模式 - 需要重新加载图表
      adminStore.addWord({
        id: `word_${Date.now()}`,
        label: wordForm.value.label.trim(),
        pos: posValue as any,
        definition: wordForm.value.definition.trim() || undefined,
        examples: wordForm.value.examples.filter(e => e.trim()),
      })

      // 刷新图表数据
      const data = await WordNetService.fetchWordGraph(graphStore.searchQuery || '*')
      graphStore.setGraphData(data)
    }

    // 关闭对话框
    closeWordDialog()
  } catch (error) {
    console.error('Failed to save word:', error)
    alert('保存词汇失败')
  }
}

// 创建关系相关函数
function handleSelectionChange(nodes: any[]) {
  selectedNodes.value = nodes

  // 检查是否存在关系
  if (nodes.length === 2) {
    adminStore.loadData()
    const sourceId = nodes[0].id
    const targetId = nodes[1].id

    // 只查找从第一个节点到第二个节点的单向关系
    existingRelations.value = adminStore.connections.filter(
      c => c.source === sourceId && c.target === targetId
    )
  } else {
    existingRelations.value = []
  }
}

function clearSelection() {
  selectedNodes.value = []
  // 清除 Cytoscape 中的选择
  const cy = (containerRef.value as any)?.$cyInstance
  if (cy) {
    cy.nodes().unselect()
  }
}

function openCreateRelationDialog() {
  if (selectedNodes.value.length !== 2) return
  showCreateRelationDialog.value = true
  // 确保 adminStore 已加载数据
  adminStore.loadData()
}

// 双击边打开编辑关系对话框
function openEditRelationFromEdge(edgeData: any) {
  // 从边的数据中获取源和目标节点
  adminStore.loadData()

  const sourceNode = adminStore.words.find(w => w.id === edgeData.source)
  const targetNode = adminStore.words.find(w => w.id === edgeData.target)

  if (sourceNode && targetNode) {
    // 设置选中的节点（模拟双选节点的状态）
    selectedNodes.value = [
      { id: sourceNode.id, label: sourceNode.label },
      { id: targetNode.id, label: targetNode.label }
    ]

    // 查找这两个节点之间的所有关系
    existingRelations.value = adminStore.connections.filter(
      c => c.source === edgeData.source && c.target === edgeData.target
    )

    // 打开对话框
    showCreateRelationDialog.value = true
  }
}

function closeCreateRelationDialog() {
  showCreateRelationDialog.value = false
  newRelationForm.value = {
    relationType: '',
  }
}

function getRelationLabel(key: string): string {
  const relationType = adminStore.relationTypes.find(rt => rt.key === key)
  return relationType ? relationType.label : key
}

// 可用的关系类型（用于显示）
const availableRelationTypes = computed(() => {
  return adminStore.relationTypes
})

// 检查关系是否已存在
function isRelationExists(relationKey: string): boolean {
  if (selectedNodes.value.length !== 2) return false
  const sourceId = selectedNodes.value[0].id
  const targetId = selectedNodes.value[1].id

  return existingRelations.value.some(
    r => r.source === sourceId && r.target === targetId && r.relation === relationKey
  )
}

// 删除关系
async function deleteRelation(connectionId: string) {
  if (!confirm('确定要删除这个关系吗？如果有配对的反向关系，也会一并删除。')) {
    return
  }

  try {
    // 查找这个连接
    const connection = adminStore.connections.find(c => c.id === connectionId)
    if (!connection) return

    // 删除这个连接
    adminStore.deleteConnection(connectionId)

    // 查找并删除反向关系
    const relationTypeConfig = adminStore.relationTypes.find(rt => rt.key === connection.relation)
    if (relationTypeConfig?.pairWith) {
      const reverseConnection = adminStore.connections.find(
        c => c.source === connection.target &&
             c.target === connection.source &&
             c.relation === relationTypeConfig.pairWith
      )
      if (reverseConnection) {
        adminStore.deleteConnection(reverseConnection.id)
      }
    }

    // 更新已存在的关系列表
    existingRelations.value = existingRelations.value.filter(r => r.id !== connectionId)

    // 刷新图表数据
    const data = await WordNetService.fetchWordGraph(graphStore.searchQuery || '*')
    graphStore.setGraphData(data)
  } catch (error) {
    console.error('Failed to delete relation:', error)
    alert('删除关系失败')
  }
}

async function saveRelation() {
  if (!newRelationForm.value.relationType || selectedNodes.value.length !== 2) {
    alert('请选择关系类型')
    return
  }

  // 检查是否已存在相同关系
  if (isRelationExists(newRelationForm.value.relationType)) {
    alert('该关系已存在')
    return
  }

  try {
    const sourceId = selectedNodes.value[0].id
    const targetId = selectedNodes.value[1].id
    const relationType = newRelationForm.value.relationType

    // 添加关系
    adminStore.addConnection({
      source: sourceId,
      target: targetId,
      relation: relationType as any,
    })

    // 检查是否需要添加反向关系
    const relationTypeConfig = adminStore.relationTypes.find(rt => rt.key === relationType)
    if (relationTypeConfig?.pairWith) {
      adminStore.addConnection({
        source: targetId,
        target: sourceId,
        relation: relationTypeConfig.pairWith as any,
      })
    }

    // 重置表单
    newRelationForm.value.relationType = ''

    // 刷新已存在的关系列表（只显示单向）
    adminStore.loadData()
    const newExistingRelations = adminStore.connections.filter(
      c => c.source === sourceId && c.target === targetId
    )
    existingRelations.value = newExistingRelations

    // 如果是创建模式（之前没有关系），则关闭对话框
    if (existingRelations.value.length === 2 && !relationTypeConfig?.pairWith) {
      // 只有一个关系且无配对
      closeCreateRelationDialog()
      clearSelection()
    } else if (existingRelations.value.length === 0) {
      closeCreateRelationDialog()
      clearSelection()
    }

    // 刷新图表数据
    const data = await WordNetService.fetchWordGraph(graphStore.searchQuery || '*')
    graphStore.setGraphData(data)
  } catch (error) {
    console.error('Failed to create relation:', error)
    alert('创建关系失败')
  }
}

// 使用 toRef 创建响应式引用
const graphDataRef = toRef(graphStore, 'graphData')
const activeRelationsRef = toRef(graphStore, 'activeRelations')
const layoutRef = toRef(graphStore, 'layout')
const showDefinitionInNodeRef = toRef(graphStore, 'showDefinitionInNode')

const { containerRef, fitView, exportPNG, updateNodeData } = useCytoscape({
  get graphData() {
    return graphDataRef.value
  },
  get activeRelations() {
    return activeRelationsRef.value
  },
  get layout() {
    return layoutRef.value
  },
  get showDefinitionInNode() {
    return showDefinitionInNodeRef.value
  },
  onNodeClick: (nodeData) => graphStore.setSelectedNode(nodeData),
  onBackgroundDblClick: () => openAddWordDialog(),
  onNodeDblClick: (nodeData) => openEditWordDialog(nodeData),
  onEdgeDblClick: (edgeData) => openEditRelationFromEdge(edgeData),
  onSelectionChange: (nodes) => handleSelectionChange(nodes),
})

// 导出方法供父组件调用
defineExpose({
  fitView,
  exportPNG,
})
</script>
