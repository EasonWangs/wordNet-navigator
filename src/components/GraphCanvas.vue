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

    <!-- 快速添加/编辑词汇对话框 - 右侧滑动面板 -->
    <div
      v-if="showAddWordDialog || showEditWordDialog"
      class="absolute top-5 right-5 w-[420px] max-h-[calc(100%-2.5rem)] bg-white/95 backdrop-blur-md shadow-2xl z-[60] overflow-y-auto rounded-lg border border-gray-200"
      @keydown.enter="handleWordDialogEnter"
      @keydown.delete.stop
      @keydown.backspace.stop
    >
      <!-- Header -->
      <div class="bg-gradient-to-r from-green-500/60 to-blue-500/60 backdrop-blur-sm text-white px-4 py-3 flex justify-between items-center sticky top-0 z-10">
        <h3 class="text-base font-bold">{{ showEditWordDialog ? '✏️ 编辑词汇' : '➕ 快速添加词汇' }}</h3>
        <div class="flex items-center gap-2">
          <!-- 朗读按钮 -->
          <button
            v-if="isSupported && wordForm.label.trim()"
            @click="smartSpeak(wordForm.label, { rate: 0.9 })"
            :disabled="isSpeaking"
            class="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-all disabled:opacity-50"
            :title="isSpeaking ? '正在朗读...' : '朗读词汇'"
          >
            <svg v-if="!isSpeaking" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3.5a1 1 0 011 1v11a1 1 0 01-1.707.707l-3.5-3.5H3a1 1 0 010-2h2.793l3.5-3.5A1 1 0 0110 3.5z"/>
              <path d="M13.5 7a1 1 0 011.414 0 5 5 0 010 7.071 1 1 0 11-1.414-1.414 3 3 0 000-4.243A1 1 0 0113.5 7z"/>
            </svg>
            <svg v-else class="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5 4a2 2 0 00-2 2v8a2 2 0 002 2h2V4H5zm4 0v12h2V4H9zm4 0v12h2a2 2 0 002-2V6a2 2 0 00-2-2h-2z" clip-rule="evenodd"/>
            </svg>
          </button>
          <button
            class="w-7 h-7 bg-white/20 rounded-full text-xl leading-none hover:bg-white/30 transition-all hover:rotate-90 duration-200"
            @click="closeWordDialog"
          >
            ×
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6">
        <div v-if="showAddWordDialog || showEditWordDialog" class="space-y-4">
          <div v-if="showEditWordDialog" class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">词汇 <span class="text-red-500">*</span></label>
              <input
                ref="wordInputRef"
                v-model="wordForm.label"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                placeholder="例如: dog"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">音标</label>
              <input
                v-model="wordForm.phonetic"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                placeholder="例如: /dɒg/ 或 /dɔːg/"
              />
            </div>
          </div>
          <div v-else>
            <label class="block text-sm font-medium text-gray-700 mb-1">词汇 <span class="text-red-500">*</span></label>
            <div class="relative">
              <input
                ref="wordInputRef"
                v-model="wordForm.label"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                placeholder="例如: dog"
                @focus="showAddWordSearchResults = true"
                @blur="handleAddWordSearchBlur"
              />
              <!-- 搜索结果提示 -->
              <div
                v-if="showAddWordSearchResults && existingWordMatches.length > 0"
                class="absolute z-10 w-full mt-1 bg-white border border-orange-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
              >
                <div class="px-3 py-2 bg-orange-50 border-b border-orange-200 text-xs text-orange-700">
                  ⚠️ 发现 {{ existingWordMatches.length }} 个相似词汇：
                </div>
                <div
                  v-for="word in existingWordMatches"
                  :key="word.id"
                  class="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                  @mousedown.prevent="selectExistingWord(word)"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="font-medium">{{ word.label }}</span>
                      <span v-if="word.posDefinitions && word.posDefinitions[0]?.definition" class="text-gray-500 ml-2 text-xs">
                        - {{ word.posDefinitions[0].definition.substring(0, 30) }}{{ word.posDefinitions[0].definition.length > 30 ? '...' : '' }}
                      </span>
                    </div>
                    <span class="text-xs text-blue-600">点击编辑</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-xs font-medium text-gray-700">词性-定义对</label>
              <button
                type="button"
                class="text-xs text-primary-600 hover:text-primary-800"
                @click="addPosDefinitionPair"
              >
                + 添加
              </button>
            </div>
            <div class="space-y-1.5">
              <div
                v-for="(pair, index) in wordForm.posDefinitions"
                :key="index"
                class="border border-gray-200 rounded-md px-2.5 py-2 bg-gray-50"
              >
                <div class="flex items-center gap-2">
                  <select
                    v-model="pair.pos"
                    class="w-28 px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 text-xs"
                  >
                    <option value="">- 词性 -</option>
                    <option v-for="posType in adminStore.posTypes" :key="posType.key" :value="posType.key">
                      {{ posType.label }}<span v-if="posType.abbreviation"> ({{ posType.abbreviation }})</span>
                    </option>
                  </select>
                  <input
                    v-model="pair.definition"
                    type="text"
                    class="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 text-sm"
                    placeholder="该词性的定义"
                    @keydown.enter.stop
                  />
                  <button
                    v-if="wordForm.posDefinitions.length > 1"
                    type="button"
                    class="px-2 py-1 text-red-600 hover:bg-red-100 rounded transition-colors text-xs"
                    title="删除"
                    @click="removePosDefinitionPair(index)"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="showEditWordDialog">
            <label class="block text-sm font-medium text-gray-700 mb-1">例句</label>
            <div v-for="(_example, index) in wordForm.examples" :key="index" class="flex mb-2">
              <input
                v-model="wordForm.examples[index]"
                type="text"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-primary-500"
                placeholder="输入例句"
              />
              <button
                class="px-3 py-2 bg-red-500 text-white rounded-r-md hover:bg-red-600"
                @click="removeExample(index)"
              >
                删除
              </button>
            </div>
            <button
              class="mt-2 text-sm text-primary-600 hover:text-primary-800"
              @click="addExample"
            >
              + 添加例句
            </button>
          </div>
          <!-- 快速关联其他词汇 -->
          <div v-if="showEditWordDialog" class="pt-4 border-t border-gray-200">
            <label class="block text-sm font-medium text-gray-700 mb-2">🔗 快速关联词汇</label>
            <div class="relative">
              <input
                ref="quickLinkInputRef"
                v-model="quickLinkSearch"
                type="text"
                placeholder="搜索词汇..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 text-sm"
                @focus="showQuickLinkResults = true"
                @blur="handleQuickLinkBlur"
                @keydown.down.prevent="moveQuickLinkSelection('down')"
                @keydown.up.prevent="moveQuickLinkSelection('up')"
                @keydown.enter="handleQuickLinkEnter"
                @keydown.esc.stop.prevent="hideQuickLinkResults"
              />
              <!-- 搜索结果下拉列表 - 使用 Teleport 避免被父容器裁剪 -->
              <Teleport to="body">
                <div
                  v-if="showQuickLinkResults && filteredQuickLinkWords.length > 0"
                  ref="quickLinkListRef"
                  class="fixed z-[70] bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
                  :style="getQuickLinkDropdownStyle()"
                >
                <div
                  v-for="(word, index) in filteredQuickLinkWords"
                  :key="word.id"
                  ref="quickLinkItemRefs"
                  class="px-3 py-2 cursor-pointer text-sm hover:bg-gray-100"
                  :class="{ 'bg-gray-100': index === quickLinkActiveIndex }"
                  @mousedown.prevent="selectQuickLinkWord(word)"
                  @mouseenter="quickLinkActiveIndex = index"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                      <span class="font-medium">{{ word.label }}</span>
                      <span v-if="word.posDefinitions && word.posDefinitions[0]?.definition" class="text-gray-500 ml-2 text-xs">
                        - {{ word.posDefinitions[0].definition.substring(0, 25) }}{{ word.posDefinitions[0].definition.length > 25 ? '...' : '' }}
                      </span>
                    </div>
                    <div v-if="getWordRelationCount(word.id) > 0" class="flex-shrink-0 ml-2">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {{ getWordRelationCount(word.id) }} 条关系
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              </Teleport>
            </div>
          </div>
        </div>
        <div class="mt-6 flex items-center justify-between">
          <!-- 左侧删除按钮（仅在编辑模式且无关系时显示） -->
          <button
            v-if="showEditWordDialog && isIsolatedWord"
            class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-300"
            title="删除独立节点"
            @click="deleteWord"
          >
            删除词汇
          </button>
          <div v-else></div>

          <!-- 右侧操作按钮 -->
          <div class="flex space-x-3">
            <button
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              @click="closeWordDialog"
            >
              取消
            </button>
            <button
              class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
              :disabled="!wordForm.label.trim()"
              @click="saveWord"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- /编辑词汇对话框 -->

    <!-- 创建/编辑关系对话框 -->
    <div
      v-if="showCreateRelationDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeCreateRelationDialog"
      @keydown.delete.stop
      @keydown.backspace.stop
    >
      <div class="bg-white rounded-lg p-4 w-full max-w-md">
        <h3 class="text-base font-semibold mb-3">
          {{ existingRelations.length > 0 ? '编辑词汇关系' : '创建词汇关系' }}
        </h3>
        <div class="mb-3 p-2 bg-gray-50 rounded">
          <div class="flex items-center flex-wrap gap-2 text-sm">
            <span class="font-medium text-gray-700">{{ selectedNodes[1]?.label }}</span>
            <span class="text-gray-400">是</span>
            <span class="font-medium text-gray-700">{{ selectedNodes[0]?.label }}</span>
            <!-- 已存在的关系 - 内联显示 -->
            <template v-if="existingRelations.length > 0">
              <span class="text-gray-400">的</span>
              <div class="flex items-center flex-wrap gap-1.5">
                <span
                  v-for="relation in existingRelations"
                  :key="relation.id"
                  class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                >
                  {{ getRelationLabel(relation.relation) }}
                  <button
                    class="hover:text-red-600 font-bold"
                    title="删除此关系"
                    @click="deleteRelation(relation.id)"
                  >
                    ×
                  </button>
                </span>
              </div>
            </template>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1.5">
            {{ existingRelations.length > 0 ? '添加新关系' : '选择关系类型' }}
            <span class="text-red-500">*</span>
          </label>
          <div class="space-y-1.5 max-h-[500px] overflow-y-auto">
            <!-- 遍历分组 -->
            <div
              v-for="(group, groupIndex) in groupedRelationTypes"
              :key="groupIndex"
              :class="group.isPair ? 'grid grid-cols-2 gap-2' : ''"
            >
              <label
                v-for="relationType in group.relations"
                :key="relationType.key"
                class="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50 transition-colors"
                :class="{
                  'border-primary-500 bg-primary-50': newRelationForm.relationType === relationType.key,
                  'opacity-50 cursor-not-allowed': isRelationExists(relationType.key)
                }"
              >
                <input
                  v-model="newRelationForm.relationType"
                  type="radio"
                  :value="relationType.key"
                  class="mr-2 flex-shrink-0"
                  :disabled="isRelationExists(relationType.key)"
                />
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">{{ relationType.label }}</div>
                  <span v-if="isRelationExists(relationType.key)" class="text-xs text-gray-500">(已存在)</span>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button
            class="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            @click="closeCreateRelationDialog"
          >
            {{ existingRelations.length > 0 ? '完成' : '取消' }}
          </button>
          <button
            v-if="newRelationForm.relationType"
            class="px-3 py-1.5 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
            @click="saveRelation"
          >
            {{ existingRelations.length > 0 ? '添加' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, toRef, computed, nextTick, watch, onMounted } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { useAdminStore } from '@/stores/adminStore'
import { useCytoscape } from 'cyto-orbit'
import { WordNetService } from '@/services/wordnetService'
import { migrateWordData } from '@/utils/wordDataUtils'
import { useTTS } from '@/composables/useTTS'
import type { PosDefinitionPair, WordNode, WordEdge } from '@/types/wordnet'
import { storageService } from '@/services/storageService'
import type { StoredConnection, StoredWord, StoredRelationType } from '@/services/storageService'
import Legend from './Legend.vue'

const graphStore = useGraphStore()
const adminStore = useAdminStore()

const emit = defineEmits<{
  search: [keyword: string]
}>()

// TTS 功能
const { smartSpeak, isSpeaking, isSupported } = useTTS()

interface SelectedNode {
  id: string
  label: string
}

interface WordFormState {
  label: string
  phonetic: string
  posDefinitions: PosDefinitionPair[]
  examples: string[]
}

type RelationEdgeData = Pick<WordEdge, 'source' | 'target' | 'relation'> & { id?: string }

// 组件初始化时加载一次数据
onMounted(async () => {
  const dataImported = await adminStore.loadData()

  // 如果导入了新数据（首次运行），需要重新加载 graphStore 的激活关系列表
  if (dataImported) {
    graphStore.reloadActiveRelations()
    console.log('🔄 已更新激活的关系类型列表')
  }
})

// 选中的节点
const selectedNodes = ref<SelectedNode[]>([])

// 已存在的关系
const existingRelations = ref<StoredConnection[]>([])

// 添加/编辑词汇对话框
const showAddWordDialog = ref(false)
const showEditWordDialog = ref(false)
const editingWordId = ref<string | null>(null)
const wordInputRef = ref<HTMLInputElement | null>(null)
const clickPosition = ref<{ x: number; y: number } | null>(null)
const wordForm = ref<WordFormState>({
  label: '',
  phonetic: '',
  posDefinitions: [{ pos: '', definition: '' }],
  examples: [],
})

// 创建关系对话框
const showCreateRelationDialog = ref(false)
const newRelationForm = ref<{ relationType: string }>({
  relationType: '',
})

// 快速关联词汇
const quickLinkSearch = ref('')
const showQuickLinkResults = ref(false)
const quickLinkActiveIndex = ref(-1)

// 添加词汇时的搜索
const showAddWordSearchResults = ref(false)

function openAddWordDialog(position?: { x: number; y: number }) {
  showAddWordDialog.value = true
  showEditWordDialog.value = false
  editingWordId.value = null
  clickPosition.value = position || null
  wordForm.value = {
    label: '',
    phonetic: '',
    posDefinitions: [{ pos: '', definition: '' }],
    examples: [],
  }

  // 自动聚焦到词汇输入框
  nextTick(() => {
    wordInputRef.value?.focus()
  })
}

function openEditWordDialog(nodeData: WordNode) {
  showEditWordDialog.value = true
  showAddWordDialog.value = false
  editingWordId.value = nodeData.id

  // 关闭词汇详情面板，避免同时展示两个侧栏
  graphStore.setSelectedNode(null)

  const word = adminStore.words.find(w => w.id === nodeData.id)

  if (word) {
    // 迁移数据到新格式，确保旧数据结构也能正常显示
    const migratedWord = migrateWordData(word)

    wordForm.value = {
      label: word.label,
      phonetic: word.phonetic ?? '',
      posDefinitions: migratedWord.posDefinitions && migratedWord.posDefinitions.length > 0
        ? migratedWord.posDefinitions.map(pd => ({ ...pd }))
        : [{ pos: '', definition: '' }],
      examples: word.examples ? [...word.examples] : [],
    }
  } else {
    wordForm.value = {
      label: nodeData.label || '',
      phonetic: '',
      posDefinitions: [{ pos: '', definition: '' }],
      examples: [],
    }
  }

  nextTick(() => {
    wordInputRef.value?.focus()
  })
}

function closeWordDialog() {
  showAddWordDialog.value = false
  showEditWordDialog.value = false
  editingWordId.value = null
  clickPosition.value = null
  quickLinkSearch.value = ''
  showQuickLinkResults.value = false
  showAddWordSearchResults.value = false
  wordForm.value = {
    label: '',
    phonetic: '',
    posDefinitions: [{ pos: '', definition: '' }],
    examples: [],
  }
}

// 添加词性-定义对
function addPosDefinitionPair() {
  wordForm.value.posDefinitions.push({ pos: '', definition: '' })
}

// 删除词性-定义对
function removePosDefinitionPair(index: number) {
  if (wordForm.value.posDefinitions.length > 1) {
    wordForm.value.posDefinitions.splice(index, 1)
  }
}

// 处理词汇对话框的回车键
function handleWordDialogEnter(e: KeyboardEvent) {
  const target = e.target as (HTMLElement & { isComposing?: boolean })

  // 检查是否在中文输入法输入过程中（IME composition）
  // isComposing 为 true 表示正在使用输入法输入，此时回车是用来确认输入的
  if (e.isComposing || target.isComposing) {
    return // 输入法输入中，不触发提交
  }

  // 检查是否在 textarea 中（textarea 需要回车换行）
  if (target.tagName === 'TEXTAREA') {
    return // textarea 中的回车不触发提交
  }

  // 其他情况下回车提交表单
  e.preventDefault()
  saveWord()
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

  // 过滤掉完全空的词性-定义对
  const filteredPosDefinitions = wordForm.value.posDefinitions
    .map(pd => ({
      pos: pd.pos?.trim() || undefined,
      definition: pd.definition?.trim() || undefined,
    }))
    .filter(pd => pd.pos || pd.definition)

  const posDefinitions = filteredPosDefinitions.length > 0
    ? filteredPosDefinitions
    : [{ pos: undefined, definition: undefined }]

  try {
    if (showEditWordDialog.value && editingWordId.value) {
      // 编辑模式 - 只更新本地数据，不重新加载图表
      const updatedData = {
        label: wordForm.value.label.trim(),
        phonetic: wordForm.value.phonetic.trim() || undefined,
        posDefinitions,
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
      // 添加模式 - 直接在画布添加节点，不刷新整个图表
      const newWordId = `word_${Date.now()}`
      const newWordData = {
        id: newWordId,
        label: wordForm.value.label.trim(),
        phonetic: wordForm.value.phonetic.trim() || undefined,
        posDefinitions,
        examples: wordForm.value.examples.filter(e => e.trim()),
      }

      // 保存到 LocalStorage
      adminStore.addWord(newWordData)

      // 直接在 Cytoscape 画布添加节点
      if (addNode) {
        addNode(newWordData, clickPosition.value || undefined)
      }
    }

    // 关闭对话框
    closeWordDialog()
  } catch (error) {
    console.error('Failed to save word:', error)
    alert('保存词汇失败')
  }
}

// 智能排序函数：词首匹配优先
function sortByMatchPosition(words: StoredWord[], searchTerm: string) {
  const lowerSearchTerm = searchTerm.toLowerCase()

  return words.sort((a, b) => {
    const aLabel = a.label.toLowerCase()
    const bLabel = b.label.toLowerCase()
    const aStartsWith = aLabel.startsWith(lowerSearchTerm)
    const bStartsWith = bLabel.startsWith(lowerSearchTerm)

    // 1. 词首匹配的优先
    if (aStartsWith && !bStartsWith) return -1
    if (!aStartsWith && bStartsWith) return 1

    // 2. 都是词首匹配或都不是词首匹配时，按匹配位置排序
    const aIndex = aLabel.indexOf(lowerSearchTerm)
    const bIndex = bLabel.indexOf(lowerSearchTerm)
    if (aIndex !== bIndex) return aIndex - bIndex

    // 3. 匹配位置相同时，按字母顺序排序
    return aLabel.localeCompare(bLabel)
  })
}

// 添加词汇时检查是否已存在
const existingWordMatches = computed<StoredWord[]>(() => {
  if (!showAddWordDialog.value || !wordForm.value.label.trim()) {
    return []
  }

  const searchTerm = wordForm.value.label.toLowerCase()
  const matches = adminStore.words
    .filter(w => w.label.toLowerCase().includes(searchTerm))

  // 应用智能排序
  const sorted = sortByMatchPosition([...matches], searchTerm)
  return sorted.slice(0, 5) // 最多显示5个结果
})

function handleAddWordSearchBlur() {
  // 延迟关闭，以便点击事件能够触发
  setTimeout(() => {
    showAddWordSearchResults.value = false
  }, 200)
}

function selectExistingWord(word: StoredWord) {
  // 关闭添加对话框
  closeWordDialog()

  // 打开编辑对话框
  openEditWordDialog(word)
}

// 快速关联词汇相关函数
const quickLinkListRef = ref<HTMLElement | null>(null)
const quickLinkItemRefs = ref<HTMLElement[]>([])
const quickLinkInputRef = ref<HTMLInputElement | null>(null)

// 获取快速关联下拉列表的位置
function getQuickLinkDropdownStyle() {
  if (!quickLinkInputRef.value) {
    return { display: 'none' }
  }

  const rect = quickLinkInputRef.value.getBoundingClientRect()
  return {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`
  }
}

function ensureQuickLinkOptionVisible(index: number) {
  if (index < 0) {
    return
  }

  nextTick(() => {
    const listEl = quickLinkListRef.value
    const itemEl = quickLinkItemRefs.value[index]
    if (!listEl || !itemEl) {
      return
    }

    const optionTop = itemEl.offsetTop
    const optionBottom = optionTop + itemEl.offsetHeight
    const viewTop = listEl.scrollTop
    const viewBottom = viewTop + listEl.clientHeight

    if (optionTop < viewTop) {
      listEl.scrollTop = optionTop
    } else if (optionBottom > viewBottom) {
      listEl.scrollTop = optionBottom - listEl.clientHeight
    }
  })
}

// 计算词汇的关联次数
function getWordRelationCount(wordId: string): number {
  return adminStore.connections.filter(c =>
    c.source === wordId || c.target === wordId
  ).length
}

const filteredQuickLinkWords = computed<StoredWord[]>(() => {
  if (!quickLinkSearch.value.trim() || !editingWordId.value) {
    return []
  }

  const searchTerm = quickLinkSearch.value.toLowerCase()

  // 获取当前词汇已经关联的所有节点ID
  const connectedNodeIds = new Set<string>()
  adminStore.connections.forEach(c => {
    if (c.source === editingWordId.value) {
      connectedNodeIds.add(c.target)
    }
    if (c.target === editingWordId.value) {
      connectedNodeIds.add(c.source)
    }
  })

  const matches = adminStore.words
    .filter(w =>
      w.id !== editingWordId.value && // 排除当前编辑的词汇
      !connectedNodeIds.has(w.id) && // 排除已经关联过的词汇
      w.label.toLowerCase().includes(searchTerm)
    )

  // 应用智能排序
  const sorted = sortByMatchPosition([...matches], searchTerm)
  return sorted.slice(0, 10) // 最多显示10个结果
})

watch(filteredQuickLinkWords, newItems => {
  quickLinkItemRefs.value = []

  if (!newItems.length) {
    quickLinkActiveIndex.value = -1
    return
  }

  // 不自动选中第一项，保持 -1（无选中状态）
  // 只有当用户使用方向键时才选中
  if (quickLinkActiveIndex.value >= newItems.length) {
    quickLinkActiveIndex.value = -1
  } else if (quickLinkActiveIndex.value >= 0) {
    ensureQuickLinkOptionVisible(quickLinkActiveIndex.value)
  }
})

function moveQuickLinkSelection(direction: 'up' | 'down') {
  const items = filteredQuickLinkWords.value
  if (!items.length) {
    return
  }

  showQuickLinkResults.value = true

  if (direction === 'down') {
    if (quickLinkActiveIndex.value === -1) {
      quickLinkActiveIndex.value = 0
    } else {
      quickLinkActiveIndex.value = (quickLinkActiveIndex.value + 1) % items.length
    }
    ensureQuickLinkOptionVisible(quickLinkActiveIndex.value)
    return
  }

  // direction === 'up'
  if (quickLinkActiveIndex.value <= 0) {
    quickLinkActiveIndex.value = items.length - 1
  } else {
    quickLinkActiveIndex.value -= 1
  }

  ensureQuickLinkOptionVisible(quickLinkActiveIndex.value)
}

function confirmQuickLinkSelection() {
  const items = filteredQuickLinkWords.value
  if (!items.length) {
    return
  }

  // 只有在有选中项时才触发关联，避免误操作
  if (quickLinkActiveIndex.value < 0) {
    return
  }

  const targetWord = items[quickLinkActiveIndex.value]
  if (targetWord) {
    selectQuickLinkWord(targetWord)
  }
}

function hideQuickLinkResults() {
  showQuickLinkResults.value = false
  quickLinkActiveIndex.value = -1
}

function handleQuickLinkEnter(event: KeyboardEvent) {
  if (!filteredQuickLinkWords.value.length) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  confirmQuickLinkSelection()
}

function handleQuickLinkBlur() {
  // 延迟关闭，以便点击事件能够触发
  setTimeout(() => {
    hideQuickLinkResults()
  }, 200)
}

function selectQuickLinkWord(targetWord: StoredWord) {
  if (!editingWordId.value) return

  // 关闭搜索结果
  showQuickLinkResults.value = false
  quickLinkSearch.value = ''
  quickLinkActiveIndex.value = -1

  // 设置选中的节点
  const currentWord = adminStore.words.find(w => w.id === editingWordId.value)
  if (!currentWord) return

  selectedNodes.value = [
    { id: currentWord.id, label: currentWord.label },
    { id: targetWord.id, label: targetWord.label }
  ]

  // 查找已存在的关系
  existingRelations.value = adminStore.connections.filter(
    c => c.source === currentWord.id && c.target === targetWord.id
  )

  // 打开关系对话框
  nextTick(() => {
    showCreateRelationDialog.value = true
  })
}

// 创建关系相关函数
function handleSelectionChange(nodes: WordNode[]) {
  selectedNodes.value = nodes.map(node => ({ id: node.id, label: node.label }))

  // 当选中2个节点时，自动打开关系对话框
  if (nodes.length === 2) {
    const sourceId = nodes[0].id
    const targetId = nodes[1].id

    // 只查找从第一个节点到第二个节点的单向关系
    existingRelations.value = adminStore.connections.filter(
      c => c.source === sourceId && c.target === targetId
    )

    // 自动打开创建/编辑关系对话框
    nextTick(() => {
      showCreateRelationDialog.value = true
    })
  } else {
    existingRelations.value = []
    // 关闭对话框（如果打开着）
    if (showCreateRelationDialog.value) {
      closeCreateRelationDialog()
    }
  }
}

function clearSelection() {
  selectedNodes.value = []
  // 清除 Cytoscape 中的选择
  if (cyInstance.value) {
    cyInstance.value.nodes().unselect()
  }
}

// 双击边打开编辑关系对话框
function openEditRelationFromEdge(edgeData: RelationEdgeData) {
  // 从边的数据中获取源和目标节点
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
  // 同时清除节点选择
  clearSelection()
}

function getRelationLabel(key: string): string {
  const relationType = adminStore.relationTypes.find(rt => rt.key === key)
  return relationType ? relationType.label : key
}

// 将关系类型按配对关系分组
const groupedRelationTypes = computed(() => {
  const groups: Array<{ isPair: boolean; relations: StoredRelationType[] }> = []
  const processed = new Set<string>()

  adminStore.relationTypes.forEach(relationType => {
    if (processed.has(relationType.key)) return

    // 检查是否有配对关系
    if (relationType.pairWith) {
      // 检查是否是自配对（对称关系）
      if (relationType.pairWith === relationType.key) {
        // 对称关系（如同义词、反义词），只显示一次
        groups.push({
          isPair: false,
          relations: [relationType]
        })
        processed.add(relationType.key)
      } else {
        const pairType = adminStore.relationTypes.find(rt => rt.key === relationType.pairWith)
        if (pairType && pairType.pairWith === relationType.key) {
          // 互相配对的关系（如上位词-下位词），显示在同一行
          groups.push({
            isPair: true,
            relations: [relationType, pairType]
          })
          processed.add(relationType.key)
          processed.add(pairType.key)
        } else {
          // 配对关系不完整，单独显示
          groups.push({
            isPair: false,
            relations: [relationType]
          })
          processed.add(relationType.key)
        }
      }
    } else {
      // 没有配对关系，单独显示
      groups.push({
        isPair: false,
        relations: [relationType]
      })
      processed.add(relationType.key)
    }
  })

  return groups
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

    // 动态从图表中移除边（不刷新整个图表）
    if (removeEdge) {
      removeEdge(connection.source, connection.target, connection.relation)
    }

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

        // 动态从图表中移除反向边
        if (removeEdge) {
          removeEdge(reverseConnection.source, reverseConnection.target, reverseConnection.relation)
        }
      }
    }

    // 更新已存在的关系列表
    existingRelations.value = existingRelations.value.filter(r => r.id !== connectionId)
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

    // 获取完整的节点数据（以防节点不在图表中）
    const sourceWordData = adminStore.words.find(w => w.id === sourceId)
    const targetWordData = adminStore.words.find(w => w.id === targetId)

    // 添加关系到存储
    adminStore.addConnection({
      source: sourceId,
      target: targetId,
      relation: relationType,
    })

    // 检查并添加缺失的节点到 graphData（防止 watch 触发时节点丢失）
    const sourceNodeExists = graphStore.graphData.nodes.some(n => n.data.id === sourceId)
    const targetNodeExists = graphStore.graphData.nodes.some(n => n.data.id === targetId)

    if (!sourceNodeExists && sourceWordData) {
      graphStore.graphData.nodes.push({
        data: sourceWordData
      })
    }

    if (!targetNodeExists && targetWordData) {
      graphStore.graphData.nodes.push({
        data: targetWordData
      })
    }

    // 动态添加边到图表（不刷新整个图表）
    // 传递完整的节点数据，以便在节点不存在时自动添加
    if (addEdge) {
      addEdge(sourceId, targetId, relationType, sourceWordData, targetWordData)
    }

    // 添加边到 graphData（防止 watch 触发时边丢失）
    graphStore.graphData.edges.push({
      data: {
        source: sourceId,
        target: targetId,
        relation: relationType
      }
    })

    // 检查是否需要添加反向关系
    const relationTypeConfig = adminStore.relationTypes.find(rt => rt.key === relationType)
    if (relationTypeConfig?.pairWith) {
      adminStore.addConnection({
        source: targetId,
        target: sourceId,
        relation: relationTypeConfig.pairWith,
      })

      // 动态添加反向边到图表
      // 注意：反向关系的源和目标是相反的
      if (addEdge) {
        addEdge(targetId, sourceId, relationTypeConfig.pairWith, targetWordData, sourceWordData)
      }

      // 添加反向边到 graphData
      graphStore.graphData.edges.push({
        data: {
          source: targetId,
          target: sourceId,
          relation: relationTypeConfig.pairWith
        }
      })
    }

    // 创建成功后直接关闭对话框并清除选择
    closeCreateRelationDialog()
    clearSelection()
  } catch (error) {
    console.error('Failed to create relation:', error)
    alert('创建关系失败')
  }
}

// 使用 toRef 创建响应式引用
const graphDataRef = toRef(graphStore, 'graphData')
const graphVersionRef = toRef(graphStore, 'graphVersion')
const activeRelationsRef = toRef(graphStore, 'activeRelations')
const layoutRef = toRef(graphStore, 'layout')
const showDefinitionInNodeRef = toRef(graphStore, 'showDefinitionInNode')

// 删除节点处理器
function handleNodeDelete(nodeData: WordNode) {
  // 检查节点是否有关系
  const hasConnections = adminStore.connections.some(
    c => c.source === nodeData.id || c.target === nodeData.id
  )

  if (hasConnections) {
    alert('该词汇存在关系连接，无法删除。请先在管理界面删除其关系。')
    return
  }

  if (!confirm(`确定要删除词汇"${nodeData.label}"吗？此操作无法撤销。`)) {
    return
  }

  try {
    // 从 adminStore 删除词汇
    adminStore.deleteWord(nodeData.id)

    // 从 Cytoscape 画布中移除节点（不触发重新渲染）
    if (removeNode) {
      removeNode(nodeData.id)
    }

    // 关闭节点详情面板（如果正在显示被删除的节点）
    if (graphStore.selectedNode?.id === nodeData.id) {
      graphStore.setSelectedNode(null)
    }

    // 注意：不修改 graphStore.graphData，避免触发 watch 重新渲染
    // 下次搜索或刷新时会自动从 localStorage 获取最新数据
  } catch (error) {
    console.error('Failed to delete word:', error)
    alert('删除词汇失败')
  }
}

// 删除边（关系）处理器
function handleEdgeDelete(edgeData: RelationEdgeData) {
  if (!confirm(`确定要删除这个关系吗？如果有配对的反向关系，也会一并删除。`)) {
    return
  }

  try {
    // 查找这个连接（通过 source, target, relation 来查找）
    const connection = adminStore.connections.find(
      c => c.source === edgeData.source &&
           c.target === edgeData.target &&
           c.relation === edgeData.relation
    )

    if (!connection) {
      console.warn('Connection not found in storage')
      return
    }

    // 删除这个连接
    adminStore.deleteConnection(connection.id)

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

        // 从画布中移除反向边
        if (removeEdge) {
          removeEdge(reverseConnection.source, reverseConnection.target, reverseConnection.relation)
        }
      }
    }

    // 从 Cytoscape 画布中移除边（不触发重新渲染）
    if (removeEdge) {
      removeEdge(edgeData.source, edgeData.target, edgeData.relation)
    }
  } catch (error) {
    console.error('Failed to delete edge:', error)
    alert('删除关系失败')
  }
}

const {
  containerRef,
  cyInstance,
  fitView,
  exportPNG,
  isFitModeActive,
  updateNodeData,
  removeNode,
  removeEdge,
  addEdge,
  addNode,
} = useCytoscape({
  get graphData() {
    return graphDataRef.value
  },
  get graphVersion() {
    return graphVersionRef.value
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
  // 关系类型配置注入（cyto-orbit 与存储层解耦）；为空时初始化默认配置
  get relationTypes() {
    const types = storageService.getRelationTypes()
    return types.length > 0 ? types : storageService.initializeDefaultRelationTypes()
  },
  onNodeClick: (nodeData) => {
    if (nodeData) {
      // 单击节点：显示节点详情
      graphStore.setSelectedNode(nodeData)
    } else {
      graphStore.setSelectedNode(null)
      closeWordDialog()
    }
  },
  onNodeRightClick: (nodeData) => {
    // 右键单击节点：打开编辑对话框
    if (nodeData) {
      openEditWordDialog(nodeData)
    }
  },
  onNodeDblClick: (nodeData) => {
    if (!nodeData || !nodeData.label) return
    emit('search', nodeData.label)
  },
  onBackgroundDblClick: (position) => openAddWordDialog(position),
  onEdgeDblClick: (edgeData) => openEditRelationFromEdge(edgeData),
  onSelectionChange: (nodes) => handleSelectionChange(nodes),
  onNodeDelete: (nodeData) => handleNodeDelete(nodeData),
  onEdgeDelete: (edgeData) => handleEdgeDelete(edgeData),
  onMoreNodeClick: async (moreNodeData) => {
    // Extract parent node ID from "+" node ID (e.g., "word_123_more" -> "word_123")
    const parentNodeId = moreNodeData.id.replace('_more', '')

    // Get current node IDs from the graph (to exclude already shown nodes)
    const existingNodeIds = new Set(graphStore.graphData.nodes.map(n => n.data.id))

    try {
      // Fetch expanded connections
      const expandedData = await WordNetService.expandNode(parentNodeId, existingNodeIds)

      // Get parent node position from cytoscape
      const parentNode = cyInstance.value?.getElementById(parentNodeId)
      if (!parentNode || !parentNode.position()) {
        console.error('Parent node not found')
        return
      }

      const parentPos = parentNode.position()
      const nodeCount = expandedData.nodes.length

      // Calculate circular positions around parent node
      const radius = 180 // Distance from parent node
      const angleStep = (2 * Math.PI) / nodeCount // Evenly distribute around circle

      // 新节点层级 = 父节点层级 + 1（用于伪3D尺寸递减）
      const parentDepth = parentNode.data('depth')

      // Add new nodes to the graph with positions around parent node
      expandedData.nodes.forEach((node, index) => {
        if (addNode) {
          // Calculate position in a circle around parent
          const angle = index * angleStep
          const position = {
            x: parentPos.x + radius * Math.cos(angle),
            y: parentPos.y + radius * Math.sin(angle)
          }
          const nodeData = parentDepth !== undefined
            ? { ...node.data, depth: parentDepth + 1 }
            : node.data
          addNode(nodeData, position)
        }
      })

      // Add new edges to the graph
      expandedData.edges.forEach(edge => {
        if (addEdge) {
          addEdge(edge.data.source, edge.data.target, edge.data.relation)
        }
      })

      // Remove the "+" node and its connecting edge
      if (removeNode && removeEdge) {
        removeEdge(parentNodeId, moreNodeData.id, 'more')
        removeNode(moreNodeData.id)
      }

      // Update the graph store (add new nodes and edges)
      graphStore.graphData.nodes.push(...expandedData.nodes)
      graphStore.graphData.edges.push(...expandedData.edges)

      // Remove the "+" node from graph store
      const moreNodeIndex = graphStore.graphData.nodes.findIndex(n => n.data.id === moreNodeData.id)
      if (moreNodeIndex !== -1) {
        graphStore.graphData.nodes.splice(moreNodeIndex, 1)
      }
      const moreEdgeIndex = graphStore.graphData.edges.findIndex(
        e => e.data.source === parentNodeId && e.data.target === moreNodeData.id
      )
      if (moreEdgeIndex !== -1) {
        graphStore.graphData.edges.splice(moreEdgeIndex, 1)
      }
    } catch (error) {
      console.error('Failed to expand node:', error)
      alert('加载节点失败')
    }
  },
})

let pendingHighlightedNodeId: string | null = null

const applySelectedNodeHighlight = () => {
  if (!cyInstance.value) return

  const cy = cyInstance.value
  cy.nodes('.active-node').removeClass('active-node')

  if (!pendingHighlightedNodeId) {
    return
  }

  const targetNode = cy.$id(pendingHighlightedNodeId)
  if (targetNode && targetNode.length > 0) {
    targetNode.addClass('active-node')
  }
}

watch(
  () => graphStore.selectedNode?.id ?? null,
  (newId) => {
    pendingHighlightedNodeId = newId

    if (!cyInstance.value) {
      return
    }

    applySelectedNodeHighlight()
  },
  { immediate: true }
)

watch(
  graphVersionRef,
  () => {
    applySelectedNodeHighlight()
  }
)

watch(
  () => cyInstance.value,
  (cy) => {
    if (cy) {
      applySelectedNodeHighlight()
    }
  }
)

// 导出方法供父组件调用
defineExpose({
  fitView,
  exportPNG,
  isFitModeActive,
  openEditWordDialog,
})
</script>
