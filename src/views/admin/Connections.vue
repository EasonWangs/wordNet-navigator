<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900">词汇关系管理</h2>
      <button
        @click="showAddDialog = true"
        class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
      >
        + 添加关系
      </button>
    </div>

    <!-- 关系列表 -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">源词汇</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">关系类型</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">目标词汇</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="conn in adminStore.connections" :key="conn.id">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ getWordLabel(conn.source) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="px-2 py-1 text-xs font-medium rounded-full"
                :style="{
                  backgroundColor: getRelationColor(conn.relation) + '20',
                  color: getRelationColor(conn.relation),
                }"
              >
                {{ getRelationLabel(conn.relation) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ getWordLabel(conn.target) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(conn.createdAt) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button
                @click="deleteConnection(conn.id)"
                class="text-red-600 hover:text-red-900"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 添加关系对话框 -->
    <div
      v-if="showAddDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="closeDialog"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">添加词汇关系</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">源词汇</label>
            <select
              v-model="formData.source"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
            >
              <option value="">请选择</option>
              <option v-for="word in adminStore.words" :key="word.id" :value="word.id">
                {{ word.label }} ({{ word.pos }})
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">关系类型</label>
            <select
              v-model="formData.relation"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
            >
              <option value="">请选择</option>
              <option v-for="type in adminStore.relationTypes" :key="type.key" :value="type.key">
                {{ type.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">目标词汇</label>
            <select
              v-model="formData.target"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
            >
              <option value="">请选择</option>
              <option v-for="word in adminStore.words" :key="word.id" :value="word.id">
                {{ word.label }} ({{ word.pos }})
              </option>
            </select>
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
            @click="saveConnection"
            :disabled="!formData.source || !formData.relation || !formData.target"
            class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
import type { RelationType } from '@/types/wordnet'

const adminStore = useAdminStore()
const showAddDialog = ref(false)
const formData = ref({
  source: '',
  target: '',
  relation: '' as RelationType | '',
})

onMounted(() => {
  adminStore.loadData()
})

function getWordLabel(id: string) {
  const word = adminStore.words.find((w) => w.id === id)
  return word?.label || id
}

function getRelationLabel(relation: RelationType) {
  const type = adminStore.relationTypes.find((t) => t.key === relation)
  return type?.label || relation
}

function getRelationColor(relation: RelationType) {
  const type = adminStore.relationTypes.find((t) => t.key === relation)
  return type?.color || '#3498db'
}

function closeDialog() {
  showAddDialog.value = false
  formData.value = {
    source: '',
    target: '',
    relation: '',
  }
}

function saveConnection() {
  if (formData.value.source && formData.value.target && formData.value.relation) {
    adminStore.addConnection({
      source: formData.value.source,
      target: formData.value.target,
      relation: formData.value.relation as RelationType,
    })
    closeDialog()
  }
}

function deleteConnection(id: string) {
  if (confirm('确定要删除这个关系吗？')) {
    adminStore.deleteConnection(id)
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>
