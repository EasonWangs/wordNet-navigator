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
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">词汇</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">词性</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">上位词</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">下位词</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">同义词</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">反义词</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">整体词</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">部分词</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="word in adminStore.words" :key="word.id" class="hover:bg-gray-50">
            <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ word.label }}</td>
            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{{ word.pos }}</td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="rel in getRelatedWords(word.id, 'hypernym')"
                  :key="rel"
                  class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                >
                  {{ getWordLabel(rel) }}
                </span>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="rel in getRelatedWords(word.id, 'hyponym')"
                  :key="rel"
                  class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                >
                  {{ getWordLabel(rel) }}
                </span>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="rel in getRelatedWords(word.id, 'synonym')"
                  :key="rel"
                  class="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded"
                >
                  {{ getWordLabel(rel) }}
                </span>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="rel in getRelatedWords(word.id, 'antonym')"
                  :key="rel"
                  class="px-2 py-1 text-xs bg-red-100 text-red-800 rounded"
                >
                  {{ getWordLabel(rel) }}
                </span>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="rel in getRelatedWords(word.id, 'holonym')"
                  :key="rel"
                  class="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded"
                >
                  {{ getWordLabel(rel) }}
                </span>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="rel in getRelatedWords(word.id, 'meronym')"
                  :key="rel"
                  class="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded"
                >
                  {{ getWordLabel(rel) }}
                </span>
              </div>
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
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
          <!-- 基本信息 -->
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
              <label class="block text-sm font-medium text-gray-700 mb-1">词性 *</label>
              <select
                v-model="wordFormData.pos"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              >
                <option value="noun">名词 (noun)</option>
                <option value="verb">动词 (verb)</option>
                <option value="adjective">形容词 (adjective)</option>
                <option value="adverb">副词 (adverb)</option>
              </select>
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

          <!-- 例句 -->
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
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <!-- 上位词 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                上位词 (Hypernym)
                <span class="text-xs text-gray-500 ml-1">更抽象/更广泛的概念</span>
              </label>
              <select
                v-model="relationsFormData.hypernym"
                multiple
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 min-h-[100px]"
              >
                <option v-for="word in availableWords" :key="word.id" :value="word.id">
                  {{ word.label }} ({{ word.pos }})
                </option>
              </select>
            </div>

            <!-- 下位词 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                下位词 (Hyponym)
                <span class="text-xs text-gray-500 ml-1">更具体/更狭窄的概念</span>
              </label>
              <select
                v-model="relationsFormData.hyponym"
                multiple
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 min-h-[100px]"
              >
                <option v-for="word in availableWords" :key="word.id" :value="word.id">
                  {{ word.label }} ({{ word.pos }})
                </option>
              </select>
            </div>

            <!-- 同义词 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                同义词 (Synonym)
                <span class="text-xs text-gray-500 ml-1">意义相同或相近</span>
              </label>
              <select
                v-model="relationsFormData.synonym"
                multiple
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 min-h-[100px]"
              >
                <option v-for="word in availableWords" :key="word.id" :value="word.id">
                  {{ word.label }} ({{ word.pos }})
                </option>
              </select>
            </div>

            <!-- 反义词 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                反义词 (Antonym)
                <span class="text-xs text-gray-500 ml-1">意义相反</span>
              </label>
              <select
                v-model="relationsFormData.antonym"
                multiple
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 min-h-[100px]"
              >
                <option v-for="word in availableWords" :key="word.id" :value="word.id">
                  {{ word.label }} ({{ word.pos }})
                </option>
              </select>
            </div>

            <!-- 整体词 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                整体词 (Holonym)
                <span class="text-xs text-gray-500 ml-1">当前词是其一部分</span>
              </label>
              <select
                v-model="relationsFormData.holonym"
                multiple
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 min-h-[100px]"
              >
                <option v-for="word in availableWords" :key="word.id" :value="word.id">
                  {{ word.label }} ({{ word.pos }})
                </option>
              </select>
            </div>

            <!-- 部分词 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                部分词 (Meronym)
                <span class="text-xs text-gray-500 ml-1">当前词的组成部分</span>
              </label>
              <select
                v-model="relationsFormData.meronym"
                multiple
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 min-h-[100px]"
              >
                <option v-for="word in availableWords" :key="word.id" :value="word.id">
                  {{ word.label }} ({{ word.pos }})
                </option>
              </select>
            </div>
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
            <p class="text-xs text-blue-800">
              💡 <strong>提示:</strong> 按住 Ctrl (Windows) 或 Cmd (Mac) 键可以选择多个词汇
            </p>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/adminStore'
import type { StoredWord } from '@/services/storageService'
import type { PartOfSpeech, RelationType } from '@/types/wordnet'

const adminStore = useAdminStore()

// 词汇编辑相关
const showAddDialog = ref(false)
const editingWord = ref<StoredWord | null>(null)
const wordFormData = ref({
  id: '',
  label: '',
  pos: 'noun' as PartOfSpeech,
  definition: '',
  examples: [] as string[],
})

// 关系编辑相关
const editingRelationsWord = ref<StoredWord | null>(null)
const relationsFormData = ref({
  hypernym: [] as string[],
  hyponym: [] as string[],
  synonym: [] as string[],
  antonym: [] as string[],
  holonym: [] as string[],
  meronym: [] as string[],
})

const availableWords = computed(() => {
  // 过滤掉当前正在编辑关系的词汇
  return adminStore.words.filter((w) => w.id !== editingRelationsWord.value?.id)
})

onMounted(() => {
  adminStore.loadData()
})

function getWordLabel(id: string): string {
  const word = adminStore.words.find((w) => w.id === id)
  return word?.label || id
}

function getRelatedWords(wordId: string, relationType: RelationType): string[] {
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
    pos: word.pos,
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
    pos: 'noun',
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
  const data = {
    id: wordFormData.value.id || `word_${Date.now()}`,
    label: wordFormData.value.label,
    pos: wordFormData.value.pos,
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
  relationsFormData.value = {
    hypernym: getRelatedWords(word.id, 'hypernym'),
    hyponym: getRelatedWords(word.id, 'hyponym'),
    synonym: getRelatedWords(word.id, 'synonym'),
    antonym: getRelatedWords(word.id, 'antonym'),
    holonym: getRelatedWords(word.id, 'holonym'),
    meronym: getRelatedWords(word.id, 'meronym'),
  }
}

function closeRelationsDialog() {
  editingRelationsWord.value = null
  relationsFormData.value = {
    hypernym: [],
    hyponym: [],
    synonym: [],
    antonym: [],
    holonym: [],
    meronym: [],
  }
}

function saveRelations() {
  if (editingRelationsWord.value) {
    adminStore.updateWordRelations(editingRelationsWord.value.id, relationsFormData.value)
  }
  closeRelationsDialog()
}

function deleteWord(id: string) {
  if (confirm('确定要删除这个词汇吗？相关的连接也会被删除。')) {
    adminStore.deleteWord(id)
  }
}
</script>
