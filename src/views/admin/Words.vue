<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900">词汇与关系管理</h2>
      <button
        @click="showAddDialog = true"
        class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
      >
        + 添加词汇
      </button>
    </div>

    <!-- 词汇列表 -->
    <div class="bg-white rounded-lg shadow overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10">词汇</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">词性</th>
            <th
              v-for="relationType in adminStore.relationTypes"
              :key="relationType.key"
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
            >
              {{ relationType.label }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky right-0 bg-gray-50 z-10">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="word in adminStore.words" :key="word.id" class="hover:bg-gray-50">
            <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">{{ word.label }}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{{ getPosLabel(word.pos) }}</td>
            <td
              v-for="relationType in adminStore.relationTypes"
              :key="relationType.key"
              class="px-4 py-3"
            >
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="rel in getRelatedWords(word.id, relationType.key)"
                  :key="rel"
                  class="px-2 py-1 text-xs rounded"
                  :class="getRelationColorClass(relationType.key)"
                >
                  {{ getWordLabel(rel) }}
                </span>
              </div>
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2 sticky right-0 bg-white z-10">
              <button
                @click="editWord(word)"
                class="text-primary-600 hover:text-primary-900"
              >
                编辑词汇
              </button>
              <button
                @click="editRelations(word)"
                class="text-purple-600 hover:text-purple-900"
              >
                编辑关系
              </button>
              <button
                @click="deleteWord(word.id)"
                class="text-red-600 hover:text-red-900"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 添加/编辑词汇对话框 -->
    <div
      v-if="showAddDialog || editingWord"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeWordDialog"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold mb-4">{{ editingWord ? '编辑词汇' : '添加词汇' }}</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">词汇 *</label>
            <input
              v-model="wordFormData.label"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              placeholder="例如: dog"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">词性（可多选）</label>
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
                  v-model="wordFormData.pos"
                  class="mr-2"
                />
                <span class="text-sm">{{ pos.label }}</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">定义</label>
            <textarea
              v-model="wordFormData.definition"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              placeholder="词汇的定义"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">例句</label>
            <div v-for="(_example, index) in wordFormData.examples" :key="index" class="flex mb-2">
              <input
                v-model="wordFormData.examples[index]"
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

        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="closeWordDialog"
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            取消
          </button>
          <button
            @click="saveWord"
            class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑关系对话框 -->
    <div
      v-if="editingRelationsWord"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeRelationsDialog"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold mb-4">
          编辑词汇关系: <span class="text-primary-600">{{ editingRelationsWord.label }}</span>
        </h3>
        <div class="space-y-6">
          <!-- 动态渲染所有关系类型 -->
          <div v-for="relationType in adminStore.relationTypes" :key="relationType.key">
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700">
                {{ relationType.label }} ({{ relationType.key }})
                <span v-if="relationType.description" class="text-xs text-gray-500 ml-1">{{ relationType.description }}</span>
              </label>
              <button
                @click="openAddRelationDialog(relationType.key)"
                class="px-3 py-1 text-xs text-white rounded"
                :class="getRelationButtonClass(relationType.key)"
              >
                + 新增
              </button>
            </div>
            <div class="flex flex-wrap gap-2 min-h-[40px] p-3 border border-gray-200 rounded-md bg-gray-50">
              <span
                v-for="wordId in (relationsFormData[relationType.key] || [])"
                :key="wordId"
                class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                :class="getRelationColorClass(relationType.key)"
              >
                {{ getWordLabel(wordId) }}
                <button
                  @click="removeRelation(relationType.key, wordId)"
                  class="hover:opacity-75"
                >
                  ×
                </button>
              </span>
              <span v-if="!relationsFormData[relationType.key] || relationsFormData[relationType.key].length === 0" class="text-sm text-gray-400">暂无关系</span>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="closeRelationsDialog"
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            取消
          </button>
          <button
            @click="saveRelations"
            class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- 选择词汇对话框 -->
    <div
      v-if="showAddRelationDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
      @click.self="closeAddRelationDialog"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-lg max-h-[70vh] overflow-y-auto">
        <h3 class="text-lg font-semibold mb-4">选择词汇</h3>
        <div class="space-y-2">
          <input
            v-model="wordSearchQuery"
            type="text"
            placeholder="搜索词汇..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 mb-4"
          />
          <div class="space-y-1 max-h-[400px] overflow-y-auto">
            <button
              v-for="word in filteredAvailableWords"
              :key="word.id"
              @click="addRelationToList(word.id)"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <span class="font-medium">{{ word.label }}</span>
              <span class="text-sm text-gray-500 ml-2">({{ getPosLabel(word.pos) }})</span>
            </button>
          </div>
        </div>
        <div class="mt-6 flex justify-end">
          <button
            @click="closeAddRelationDialog"
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/adminStore'
import type { StoredWord } from '@/services/storageService'
import type { PartOfSpeech } from '@/types/wordnet'

const adminStore = useAdminStore()

// 词汇编辑相关
const showAddDialog = ref(false)
const editingWord = ref<StoredWord | null>(null)
const wordFormData = ref({
  id: '',
  label: '',
  pos: [] as string[],  // 改为数组支持多选
  definition: '',
  examples: [] as string[],
})

// 关系编辑相关
const editingRelationsWord = ref<StoredWord | null>(null)
const relationsFormData = ref<Record<string, string[]>>({})

// 添加关系对话框相关
const showAddRelationDialog = ref(false)
const currentRelationType = ref<string | null>(null)
const wordSearchQuery = ref('')

const availableWords = computed(() => {
  return adminStore.words.filter((w) => {
    // 排除当前编辑的词汇
    if (w.id === editingRelationsWord.value?.id) return false
    // 排除已经添加的词汇
    if (currentRelationType.value && relationsFormData.value[currentRelationType.value].includes(w.id)) {
      return false
    }
    return true
  })
})

const filteredAvailableWords = computed(() => {
  if (!wordSearchQuery.value.trim()) return availableWords.value
  const query = wordSearchQuery.value.toLowerCase()
  return availableWords.value.filter((w) => {
    const posMatch = Array.isArray(w.pos)
      ? w.pos.some(p => p.toLowerCase().includes(query))
      : w.pos?.toLowerCase().includes(query)
    return w.label.toLowerCase().includes(query) || posMatch
  })
})

onMounted(() => {
  adminStore.loadData()
})

function getWordLabel(id: string): string {
  const word = adminStore.words.find((w) => w.id === id)
  return word?.label || id
}

function getPosLabel(pos: string | string[]): string {
  const posArray = Array.isArray(pos) ? pos : [pos]
  return posArray.map(p => {
    const posType = adminStore.posTypes.find((pt) => pt.key === p)
    return posType ? posType.label : p
  }).join(', ')
}

function isPosSelected(posKey: string): boolean {
  return Array.isArray(wordFormData.value.pos) && wordFormData.value.pos.includes(posKey)
}

function getRelatedWords(wordId: string, relationType: string): string[] {
  return adminStore.connections
    .filter((c) => c.source === wordId && c.relation === relationType)
    .map((c) => c.target)
}

// 词汇编辑函数
function editWord(word: StoredWord) {
  editingWord.value = word
  wordFormData.value = {
    id: word.id,
    label: word.label,
    pos: Array.isArray(word.pos) ? [...word.pos] : (word.pos ? [word.pos] : []),  // 兼容单个或数组
    definition: word.definition || '',
    examples: word.examples ? [...word.examples] : [],
  }
}

function closeWordDialog() {
  showAddDialog.value = false
  editingWord.value = null
  wordFormData.value = {
    id: '',
    label: '',
    pos: [],  // 重置为空数组
    definition: '',
    examples: [],
  }
}

function addExample() {
  wordFormData.value.examples.push('')
}

function removeExample(index: number) {
  wordFormData.value.examples.splice(index, 1)
}

function saveWord() {
  // 词汇名称必填
  if (!wordFormData.value.label.trim()) {
    alert('请输入词汇名称')
    return
  }

  // 词性改为可选，但如果填写了则需要至少选择一个
  let posValue: string | string[] | undefined
  if (Array.isArray(wordFormData.value.pos) && wordFormData.value.pos.length > 0) {
    // 单个词性保存为字符串，多个保存为数组（向后兼容）
    posValue = wordFormData.value.pos.length === 1 ? wordFormData.value.pos[0] : wordFormData.value.pos
  } else {
    posValue = undefined  // 未选择词性时设为 undefined
  }

  const data = {
    id: wordFormData.value.id || `word_${Date.now()}`,
    label: wordFormData.value.label,
    pos: posValue,
    definition: wordFormData.value.definition,
    examples: wordFormData.value.examples.filter((e) => e.trim()),
  }

  if (editingWord.value) {
    adminStore.updateWord(editingWord.value.id, data)
  } else {
    adminStore.addWord(data)
  }
  closeWordDialog()
}

// 关系编辑函数
function editRelations(word: StoredWord) {
  editingRelationsWord.value = word

  // 动态构建关系表单数据
  const formData: Record<string, string[]> = {}
  adminStore.relationTypes.forEach(rt => {
    formData[rt.key] = getRelatedWords(word.id, rt.key)
  })
  relationsFormData.value = formData
}

function closeRelationsDialog() {
  editingRelationsWord.value = null
  relationsFormData.value = {}
}

function saveRelations() {
  if (editingRelationsWord.value) {
    adminStore.updateWordRelations(editingRelationsWord.value.id, relationsFormData.value)
  }
  closeRelationsDialog()
}

function removeRelation(relationType: string, wordId: string) {
  if (!relationsFormData.value[relationType]) return
  const index = relationsFormData.value[relationType].indexOf(wordId)
  if (index > -1) {
    relationsFormData.value[relationType].splice(index, 1)
  }
}

// 添加关系对话框函数
function openAddRelationDialog(relationType: string) {
  currentRelationType.value = relationType
  showAddRelationDialog.value = true
  wordSearchQuery.value = ''
}

function closeAddRelationDialog() {
  showAddRelationDialog.value = false
  currentRelationType.value = null
  wordSearchQuery.value = ''
}

function addRelationToList(wordId: string) {
  if (currentRelationType.value) {
    if (!relationsFormData.value[currentRelationType.value]) {
      relationsFormData.value[currentRelationType.value] = []
    }
    if (!relationsFormData.value[currentRelationType.value].includes(wordId)) {
      relationsFormData.value[currentRelationType.value].push(wordId)
    }
  }
  closeAddRelationDialog()
}

// 获取关系类型的颜色类（用于UI显示）
function getRelationColorClass(key: string): string {
  const colorMap: Record<string, string> = {
    hypernym: 'bg-blue-100 text-blue-800',
    hyponym: 'bg-green-100 text-green-800',
    synonym: 'bg-purple-100 text-purple-800',
    antonym: 'bg-red-100 text-red-800',
    holonym: 'bg-orange-100 text-orange-800',
    meronym: 'bg-yellow-100 text-yellow-800',
  }
  return colorMap[key] || 'bg-gray-100 text-gray-800'
}

// 获取关系类型的按钮颜色
function getRelationButtonClass(key: string): string {
  const colorMap: Record<string, string> = {
    hypernym: 'bg-blue-500 hover:bg-blue-600',
    hyponym: 'bg-green-500 hover:bg-green-600',
    synonym: 'bg-purple-500 hover:bg-purple-600',
    antonym: 'bg-red-500 hover:bg-red-600',
    holonym: 'bg-orange-500 hover:bg-orange-600',
    meronym: 'bg-yellow-500 hover:bg-yellow-600',
  }
  return colorMap[key] || 'bg-gray-500 hover:bg-gray-600'
}

function deleteWord(id: string) {
  if (confirm('确定要删除这个词汇吗？相关的连接也会被删除。')) {
    adminStore.deleteWord(id)
  }
}
</script>
