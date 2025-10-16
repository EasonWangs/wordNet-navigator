<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900">词汇与关系管理</h2>
      <div class="flex gap-3">
        <button
          @click="showAddDialog = true"
          class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
        >
          + 添加词汇
        </button>
        <button
          @click="showBulkImportDialog = true"
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          📤 批量导入
        </button>
      </div>
    </div>

    <!-- 词汇列表 -->
    <div class="bg-white rounded-lg shadow overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10 w-32">词汇</th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-28">词性</th>
            <th
              v-for="relationType in adminStore.relationTypes"
              :key="relationType.key"
              class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]"
            >
              {{ relationType.label }}
            </th>
            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase sticky right-0 bg-gray-50 z-10 w-44">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="word in adminStore.words" :key="word.id" class="hover:bg-gray-50">
            <td class="px-3 py-2 whitespace-nowrap font-medium text-gray-900 sticky left-0 bg-white z-10">{{ word.label }}</td>
            <td class="px-3 py-2 whitespace-nowrap text-gray-600 text-xs">{{ getPosLabel(word.pos) }}</td>
            <td
              v-for="relationType in adminStore.relationTypes"
              :key="relationType.key"
              class="px-3 py-2"
            >
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="rel in getRelatedWords(word.id, relationType.key)"
                  :key="rel"
                  class="px-1.5 py-0.5 text-xs rounded"
                  :class="getRelationColorClass(relationType.key)"
                >
                  {{ getWordLabel(rel) }}
                </span>
              </div>
            </td>
            <td class="px-3 py-2 whitespace-nowrap text-xs font-medium sticky right-0 bg-white z-10">
              <div class="flex gap-2">
                <button
                  @click="editWord(word)"
                  class="text-primary-600 hover:text-primary-900"
                >
                  编辑
                </button>
                <button
                  @click="editRelations(word)"
                  class="text-purple-600 hover:text-purple-900"
                >
                  关系
                </button>
                <button
                  @click="deleteWord(word.id)"
                  class="text-red-600 hover:text-red-900"
                >
                  删除
                </button>
              </div>
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
          <div class="grid grid-cols-2 gap-4">
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
              <label class="block text-sm font-medium text-gray-700 mb-1">音标</label>
              <input
                v-model="wordFormData.phonetic"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                placeholder="例如: /dɒg/ 或 /dɔːg/"
              />
            </div>
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

    <!-- 批量导入对话框 -->
    <div
      v-if="showBulkImportDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
      @click.self="closeBulkImportDialog"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">批量导入词汇</h3>
          <button
            @click="downloadTemplate"
            class="px-3 py-1.5 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-1"
          >
            📥 下载导入模板
          </button>
        </div>

        <!-- 步骤指示器 -->
        <div class="flex items-center justify-center mb-6">
          <div class="flex items-center gap-2">
            <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold', importStep >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600']">1</div>
            <div class="w-16 h-1" :class="importStep >= 2 ? 'bg-primary-500' : 'bg-gray-200'"></div>
            <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold', importStep >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600']">2</div>
            <div class="w-16 h-1" :class="importStep >= 3 ? 'bg-primary-500' : 'bg-gray-200'"></div>
            <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold', importStep >= 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600']">3</div>
          </div>
        </div>

        <!-- 步骤1: 上传文件 -->
        <div v-if="importStep === 1" class="space-y-4">
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref="fileInputRef"
              type="file"
              accept=".xlsx,.xls,.csv"
              @change="handleFileUpload"
              class="hidden"
            />
            <div v-if="!importFile">
              <div class="text-4xl mb-3">📁</div>
              <p class="text-gray-600 mb-3">支持 Excel (.xlsx, .xls) 和 CSV (.csv) 格式</p>
              <button
                @click="fileInputRef?.click()"
                class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
              >
                选择文件
              </button>
            </div>
            <div v-else>
              <div class="text-4xl mb-3">✅</div>
              <p class="text-gray-800 font-medium mb-2">{{ importFile.name }}</p>
              <p class="text-sm text-gray-500 mb-3">{{ (importFile.size / 1024).toFixed(2) }} KB</p>
              <button
                @click="importFile = null; importPreviewData = []"
                class="text-sm text-red-600 hover:text-red-800"
              >
                重新选择
              </button>
            </div>
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 class="text-sm font-semibold text-blue-800 mb-2">📋 表格格式说明</h4>
            <ul class="text-sm text-blue-700 space-y-1">
              <li>• <strong>词汇</strong>（必填）：单词或短语</li>
              <li>• <strong>词性</strong>（可选）：支持多个词性，用逗号分隔（如：noun,verb）</li>
              <li>• <strong>音标</strong>（可选）：发音标注</li>
              <li>• <strong>定义</strong>（可选）：词汇解释</li>
              <li>• <strong>例句1, 例句2, 例句3...</strong>（可选）：使用示例</li>
            </ul>
          </div>
        </div>

        <!-- 步骤2: 数据预览 -->
        <div v-if="importStep === 2" class="space-y-4">
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-semibold text-gray-800">数据预览（共 {{ importPreviewData.length }} 条）</h4>
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  value="append"
                  v-model="importMode"
                  class="text-primary-500"
                />
                <span>追加模式</span>
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  value="overwrite"
                  v-model="importMode"
                  class="text-primary-500"
                />
                <span>覆盖重复</span>
              </label>
            </div>
          </div>
          <div class="border border-gray-200 rounded-md overflow-hidden max-h-[400px] overflow-y-auto">
            <table class="min-w-full divide-y divide-gray-200 text-sm">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">词汇</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">词性</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">音标</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">定义</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">例句数</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(item, index) in importPreviewData" :key="index" :class="item.error ? 'bg-red-50' : item.isDuplicate ? 'bg-yellow-50' : ''">
                  <td class="px-3 py-2 whitespace-nowrap">
                    <span v-if="item.error" class="text-xs text-red-600" :title="item.error">❌</span>
                    <span v-else-if="item.isDuplicate" class="text-xs text-yellow-600" title="重复词汇">⚠️</span>
                    <span v-else class="text-xs text-green-600">✅</span>
                  </td>
                  <td class="px-3 py-2 whitespace-nowrap font-medium">{{ item.label || '-' }}</td>
                  <td class="px-3 py-2 whitespace-nowrap text-xs">{{ formatPosPreview(item.pos) }}</td>
                  <td class="px-3 py-2 whitespace-nowrap text-xs">{{ item.phonetic || '-' }}</td>
                  <td class="px-3 py-2 max-w-xs truncate text-xs">{{ item.definition || '-' }}</td>
                  <td class="px-3 py-2 whitespace-nowrap text-xs text-center">{{ item.examples?.length || 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex items-center gap-4 text-sm">
            <span class="text-green-600">✅ 有效: {{ validImportCount }}</span>
            <span class="text-yellow-600">⚠️ 重复: {{ duplicateImportCount }}</span>
            <span class="text-red-600">❌ 错误: {{ errorImportCount }}</span>
          </div>
        </div>

        <!-- 步骤3: 导入结果 -->
        <div v-if="importStep === 3" class="space-y-4">
          <div class="text-center py-8">
            <div class="text-6xl mb-4">🎉</div>
            <h4 class="text-xl font-semibold text-gray-800 mb-2">导入完成</h4>
            <div class="space-y-2 text-sm text-gray-600">
              <p>成功导入 <span class="font-semibold text-green-600">{{ importResult.success }}</span> 条词汇</p>
              <p v-if="importResult.skipped > 0">跳过 <span class="font-semibold text-yellow-600">{{ importResult.skipped }}</span> 条重复/错误数据</p>
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="mt-6 flex justify-between">
          <button
            v-if="importStep > 1 && importStep < 3"
            @click="importStep--"
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            上一步
          </button>
          <div v-else></div>

          <div class="flex gap-3">
            <button
              @click="closeBulkImportDialog"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              {{ importStep === 3 ? '关闭' : '取消' }}
            </button>
            <button
              v-if="importStep === 1 && importFile"
              @click="parseImportFile"
              class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
            >
              下一步
            </button>
            <button
              v-if="importStep === 2 && validImportCount > 0"
              @click="executeImport"
              class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
            >
              导入 {{ validImportCount }} 条数据
            </button>
          </div>
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
import * as XLSX from 'xlsx'

const adminStore = useAdminStore()

// 词汇编辑相关
const showAddDialog = ref(false)
const editingWord = ref<StoredWord | null>(null)
const wordFormData = ref({
  id: '',
  label: '',
  pos: [] as string[],  // 改为数组支持多选
  phonetic: '',
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
    if (posType) {
      return posType.abbreviation ? `${posType.label} (${posType.abbreviation})` : posType.label
    }
    return p
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
    phonetic: (word as any).phonetic || '',
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
    phonetic: '',
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
    phonetic: wordFormData.value.phonetic.trim() || undefined,
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

// ===== 批量导入相关 =====

// 批量导入对话框状态
const showBulkImportDialog = ref(false)
const importStep = ref(1)
const importFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const importMode = ref<'append' | 'overwrite'>('append')

// 导入数据
interface ImportWordData {
  label: string
  pos?: string | string[]
  phonetic?: string
  definition?: string
  examples?: string[]
  error?: string
  isDuplicate?: boolean
}

const importPreviewData = ref<ImportWordData[]>([])
const importResult = ref({
  success: 0,
  skipped: 0,
})

// 计算属性：统计导入数据
const validImportCount = computed(() => {
  return importPreviewData.value.filter(item => !item.error && (!item.isDuplicate || importMode.value === 'overwrite')).length
})

const duplicateImportCount = computed(() => {
  return importPreviewData.value.filter(item => item.isDuplicate && !item.error).length
})

const errorImportCount = computed(() => {
  return importPreviewData.value.filter(item => item.error).length
})

// 下载导入模板
function downloadTemplate() {
  // 创建模板数据
  const templateData = [
    {
      '词汇': 'dog',
      '词性': 'noun',
      '音标': '/dɒg/',
      '定义': '狗，犬科动物',
      '例句1': 'I have a dog.',
      '例句2': 'Dogs are loyal animals.',
      '例句3': '',
    },
    {
      '词汇': 'run',
      '词性': 'verb,noun',
      '音标': '/rʌn/',
      '定义': '跑；奔跑',
      '例句1': 'I run every morning.',
      '例句2': 'He went for a run.',
      '例句3': '',
    },
    {
      '词汇': 'beautiful',
      '词性': 'adjective',
      '音标': '/ˈbjuːtɪfl/',
      '定义': '美丽的；漂亮的',
      '例句1': 'She is beautiful.',
      '例句2': '',
      '例句3': '',
    },
  ]

  // 创建工作簿
  const ws = XLSX.utils.json_to_sheet(templateData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '词汇模板')

  // 设置列宽
  ws['!cols'] = [
    { wch: 15 }, // 词汇
    { wch: 20 }, // 词性
    { wch: 15 }, // 音标
    { wch: 30 }, // 定义
    { wch: 30 }, // 例句1
    { wch: 30 }, // 例句2
    { wch: 30 }, // 例句3
  ]

  // 导出文件
  XLSX.writeFile(wb, `wordnet-import-template-${new Date().toISOString().split('T')[0]}.xlsx`)
}

// 处理文件上传
function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    importFile.value = file
  }
}

// 解析导入文件
function parseImportFile() {
  if (!importFile.value) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })

      // 读取第一个工作表
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]

      // 转换为 JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as any[]

      // 解析并验证数据
      const parsedData: ImportWordData[] = jsonData.map((row, index) => {
        const item: ImportWordData = {
          label: String(row['词汇'] || '').trim(),
          pos: undefined,
          phonetic: String(row['音标'] || '').trim() || undefined,
          definition: String(row['定义'] || '').trim() || undefined,
          examples: [],
        }

        // 解析词性（支持逗号分隔）
        const posStr = String(row['词性'] || '').trim()
        if (posStr) {
          const posArray = posStr.split(',').map(p => p.trim()).filter(p => p)
          if (posArray.length > 0) {
            // 验证词性是否合法
            const validPos = posArray.filter(p => {
              return adminStore.posTypes.some(pt => pt.key === p || pt.label === p)
            })

            if (validPos.length !== posArray.length) {
              const invalidPos = posArray.filter(p => !adminStore.posTypes.some(pt => pt.key === p || pt.label === p))
              item.error = `无效的词性: ${invalidPos.join(', ')}`
            } else {
              // 转换为 key 格式
              const posKeys = validPos.map(p => {
                const posType = adminStore.posTypes.find(pt => pt.key === p || pt.label === p)
                return posType?.key || p
              })
              item.pos = posKeys.length === 1 ? posKeys[0] : posKeys
            }
          }
        }

        // 解析例句
        const examples: string[] = []
        for (let i = 1; i <= 10; i++) {
          const example = String(row[`例句${i}`] || '').trim()
          if (example) {
            examples.push(example)
          }
        }
        item.examples = examples

        // 验证必填字段
        if (!item.label) {
          item.error = '词汇不能为空'
        }

        // 检查是否重复
        const existingWord = adminStore.words.find(w => w.label.toLowerCase() === item.label.toLowerCase())
        if (existingWord) {
          item.isDuplicate = true
        }

        return item
      })

      importPreviewData.value = parsedData
      importStep.value = 2
    } catch (error) {
      console.error('Failed to parse file:', error)
      alert('文件解析失败，请检查文件格式是否正确')
    }
  }

  reader.readAsArrayBuffer(importFile.value)
}

// 执行导入
function executeImport() {
  let successCount = 0
  let skippedCount = 0

  importPreviewData.value.forEach(item => {
    // 跳过错误数据
    if (item.error) {
      skippedCount++
      return
    }

    // 根据模式处理重复数据
    if (item.isDuplicate) {
      if (importMode.value === 'append') {
        skippedCount++
        return
      } else {
        // 覆盖模式：找到并更新现有词汇
        const existingWord = adminStore.words.find(w => w.label.toLowerCase() === item.label.toLowerCase())
        if (existingWord) {
          adminStore.updateWord(existingWord.id, {
            label: item.label,
            pos: item.pos as any,
            phonetic: item.phonetic,
            definition: item.definition,
            examples: item.examples,
          })
          successCount++
          return
        }
      }
    }

    // 添加新词汇
    adminStore.addWord({
      id: `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label: item.label,
      pos: item.pos as any,
      phonetic: item.phonetic,
      definition: item.definition,
      examples: item.examples,
    })
    successCount++
  })

  importResult.value = {
    success: successCount,
    skipped: skippedCount,
  }

  importStep.value = 3
}

// 关闭批量导入对话框
function closeBulkImportDialog() {
  showBulkImportDialog.value = false
  importStep.value = 1
  importFile.value = null
  importPreviewData.value = []
  importMode.value = 'append'
  importResult.value = { success: 0, skipped: 0 }
}

// 格式化词性预览
function formatPosPreview(pos: string | string[] | undefined): string {
  if (!pos) return '-'
  const posArray = Array.isArray(pos) ? pos : [pos]
  return posArray.map(p => {
    const posType = adminStore.posTypes.find(pt => pt.key === p)
    return posType?.abbreviation || posType?.label || p
  }).join(', ')
}
</script>
