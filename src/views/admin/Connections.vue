<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900">词汇关系管理</h2>
    </div>

    <!-- 关系列表 -->
    <div class="bg-white rounded-lg shadow overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">源词汇</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">上位词</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">下位词</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">同义词</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">反义词</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">整体词</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">部分词</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="word in adminStore.words" :key="word.id" class="hover:bg-gray-50">
            <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ word.label }}
              <span class="ml-1 text-xs text-gray-500">({{ word.pos }})</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="rel in getRelatedWords(word.id, 'hypernym')"
                  :key="rel"
                  class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                >
                  {{ getWordLabel(rel) }}
                </span>
                <span v-if="getRelatedWords(word.id, 'hypernym').length === 0" class="text-xs text-gray-400">-</span>
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
                <span v-if="getRelatedWords(word.id, 'hyponym').length === 0" class="text-xs text-gray-400">-</span>
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
                <span v-if="getRelatedWords(word.id, 'synonym').length === 0" class="text-xs text-gray-400">-</span>
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
                <span v-if="getRelatedWords(word.id, 'antonym').length === 0" class="text-xs text-gray-400">-</span>
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
                <span v-if="getRelatedWords(word.id, 'holonym').length === 0" class="text-xs text-gray-400">-</span>
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
                <span v-if="getRelatedWords(word.id, 'meronym').length === 0" class="text-xs text-gray-400">-</span>
              </div>
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
              <button
                @click="editRelations(word)"
                class="text-primary-600 hover:text-primary-900"
              >
                编辑
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 编辑关系对话框 -->
    <div
      v-if="editingWord"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeDialog"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold mb-4">
          编辑词汇关系: <span class="text-primary-600">{{ editingWord.label }}</span>
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
                v-model="formData.relations.hypernym"
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
                v-model="formData.relations.hyponym"
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
                v-model="formData.relations.synonym"
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
                v-model="formData.relations.antonym"
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
                v-model="formData.relations.holonym"
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
                v-model="formData.relations.meronym"
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
              💡 <strong>提示:</strong> 按住 Ctrl (Windows) 或 Cmd (Mac) 键可以选择多个词汇。已选择的词汇会高亮显示。
            </p>
          </div>
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="closeDialog"
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
import type { RelationType } from '@/types/wordnet'

const adminStore = useAdminStore()
const editingWord = ref<StoredWord | null>(null)
const formData = ref({
  relations: {
    hypernym: [] as string[],
    hyponym: [] as string[],
    synonym: [] as string[],
    antonym: [] as string[],
    holonym: [] as string[],
    meronym: [] as string[],
  },
})

const availableWords = computed(() => {
  // 过滤掉当前正在编辑的词汇
  return adminStore.words.filter((w) => w.id !== editingWord.value?.id)
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

function editRelations(word: StoredWord) {
  editingWord.value = word
  formData.value = {
    relations: {
      hypernym: getRelatedWords(word.id, 'hypernym'),
      hyponym: getRelatedWords(word.id, 'hyponym'),
      synonym: getRelatedWords(word.id, 'synonym'),
      antonym: getRelatedWords(word.id, 'antonym'),
      holonym: getRelatedWords(word.id, 'holonym'),
      meronym: getRelatedWords(word.id, 'meronym'),
    },
  }
}

function closeDialog() {
  editingWord.value = null
  formData.value = {
    relations: {
      hypernym: [],
      hyponym: [],
      synonym: [],
      antonym: [],
      holonym: [],
      meronym: [],
    },
  }
}

function saveRelations() {
  if (editingWord.value) {
    adminStore.updateWordRelations(editingWord.value.id, formData.value.relations)
  }
  closeDialog()
}
</script>
