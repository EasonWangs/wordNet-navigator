<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900">词汇管理</h2>
      <button
        @click="showAddDialog = true"
        class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
      >
        + 添加词汇
      </button>
    </div>

    <!-- 词汇列表 -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">词汇</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">词性</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">定义</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">例句数</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="word in adminStore.words" :key="word.id">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ word.label }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ word.pos }}</td>
            <td class="px-6 py-4 text-sm text-gray-500 max-w-md truncate">{{ word.definition || '-' }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ word.examples?.length || 0 }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(word.createdAt) }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
              <button
                @click="editWord(word)"
                class="text-primary-600 hover:text-primary-900"
              >
                编辑
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

    <!-- 添加/编辑对话框 -->
    <div
      v-if="showAddDialog || editingWord"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeDialog"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold mb-4">{{ editingWord ? '编辑词汇' : '添加词汇' }}</h3>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">词汇</label>
              <input
                v-model="formData.label"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                placeholder="例如: dog"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">词性</label>
              <select
                v-model="formData.pos"
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
              v-model="formData.definition"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              placeholder="词汇的定义"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">例句</label>
            <div v-for="(example, index) in formData.examples" :key="index" class="flex mb-2">
              <input
                v-model="formData.examples[index]"
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
            @click="closeDialog"
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminStore } from '@/stores/adminStore'
import type { StoredWord } from '@/services/storageService'
import type { PartOfSpeech } from '@/types/wordnet'

const adminStore = useAdminStore()
const showAddDialog = ref(false)
const editingWord = ref<StoredWord | null>(null)
const formData = ref({
  id: '',
  label: '',
  pos: 'noun' as PartOfSpeech,
  definition: '',
  examples: [] as string[],
})

onMounted(() => {
  adminStore.loadData()
})

function editWord(word: StoredWord) {
  editingWord.value = word
  formData.value = {
    id: word.id,
    label: word.label,
    pos: word.pos,
    definition: word.definition || '',
    examples: word.examples ? [...word.examples] : [],
  }
}

function closeDialog() {
  showAddDialog.value = false
  editingWord.value = null
  formData.value = {
    id: '',
    label: '',
    pos: 'noun',
    definition: '',
    examples: [],
  }
}

function addExample() {
  formData.value.examples.push('')
}

function removeExample(index: number) {
  formData.value.examples.splice(index, 1)
}

function saveWord() {
  const data = {
    id: formData.value.id || `word_${Date.now()}`,
    label: formData.value.label,
    pos: formData.value.pos,
    definition: formData.value.definition,
    examples: formData.value.examples.filter((e) => e.trim()),
  }

  if (editingWord.value) {
    adminStore.updateWord(editingWord.value.id, data)
  } else {
    adminStore.addWord(data)
  }
  closeDialog()
}

function deleteWord(id: string) {
  if (confirm('确定要删除这个词汇吗？相关的连接也会被删除。')) {
    adminStore.deleteWord(id)
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>
