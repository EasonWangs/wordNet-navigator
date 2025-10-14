<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900">词性管理</h2>
      <button
        @click="showAddDialog = true"
        class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
      >
        + 添加词性
      </button>
    </div>

    <!-- 词性列表 -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">词性键</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">说明</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用数量</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="type in adminStore.posTypes" :key="type.key">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{{ type.key }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ type.label }}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ type.description || '-' }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ getWordCount(type.key) }} 个词汇
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
              <button
                @click="editType(type)"
                class="text-primary-600 hover:text-primary-900"
              >
                编辑
              </button>
              <button
                @click="deleteType(type.key)"
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
      v-if="showAddDialog || editingType"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="closeDialog"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">{{ editingType ? '编辑词性' : '添加词性' }}</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">词性键 <span class="text-red-500">*</span></label>
            <input
              v-model="formData.key"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              :class="{ 'bg-gray-100': editingType }"
              placeholder="例如: noun, verb, adj"
              required
            />
            <p v-if="!editingType" class="text-xs text-gray-500 mt-1">词性键用于程序识别</p>
            <p v-else class="text-xs text-orange-600 mt-1">
              ⚠️ 修改词性键会同步更新所有使用此词性的词汇（{{ getWordCount(editingType.key) }} 个）
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">名称 <span class="text-red-500">*</span></label>
            <input
              v-model="formData.label"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="例如: 名词"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">说明</label>
            <textarea
              v-model="formData.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              placeholder="词性说明"
            />
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
            @click="saveType"
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
import type { StoredPosType } from '@/services/storageService'

const adminStore = useAdminStore()
const showAddDialog = ref(false)
const editingType = ref<StoredPosType | null>(null)
const formData = ref({
  key: '',
  label: '',
  description: '',
})

onMounted(() => {
  adminStore.loadData()
})

function editType(type: StoredPosType) {
  editingType.value = type
  formData.value = {
    key: type.key,
    label: type.label,
    description: type.description || '',
  }
}

function closeDialog() {
  showAddDialog.value = false
  editingType.value = null
  formData.value = {
    key: '',
    label: '',
    description: '',
  }
}

function saveType() {
  // 验证词性键格式
  const keyPattern = /^[a-z0-9_]+$/
  if (!formData.value.key || !keyPattern.test(formData.value.key)) {
    alert('词性键只能包含小写字母、数字和下划线')
    return
  }

  if (!formData.value.label.trim()) {
    alert('请输入词性名称')
    return
  }

  if (editingType.value) {
    const oldKey = editingType.value.key
    const newKey = formData.value.key

    // 如果词性键发生变化
    if (oldKey !== newKey) {
      // 检查新词性键是否已存在
      if (adminStore.posTypes.find(t => t.key === newKey)) {
        alert('该词性键已被其他词性使用，请使用其他词性键')
        return
      }

      const wordCount = getWordCount(oldKey)
      const confirmMsg = wordCount > 0
        ? `修改词性键会同步更新 ${wordCount} 个词汇。\n\n这个操作不可撤销，确定要继续吗？`
        : '确定要修改词性键吗？'

      if (!confirm(confirmMsg)) {
        return
      }

      // 更新词性类型和所有相关词汇
      adminStore.updatePosTypeKey(oldKey, newKey, formData.value)
    } else {
      // 只更新其他属性
      adminStore.updatePosType(oldKey, formData.value)
    }
  } else {
    // 检查词性键是否已存在
    if (adminStore.posTypes.find(t => t.key === formData.value.key)) {
      alert('该词性键已存在，请使用其他词性键')
      return
    }

    adminStore.addPosType(formData.value)
  }
  closeDialog()
}

function deleteType(key: string) {
  const wordCount = getWordCount(key)

  let confirmMsg = '确定要删除这个词性吗？'
  if (wordCount > 0) {
    confirmMsg = `此词性正在被 ${wordCount} 个词汇使用。\n\n删除后这些词汇的词性将变为空，需要重新设置。\n\n确定要继续吗？`
  }

  if (confirm(confirmMsg)) {
    adminStore.deletePosType(key)
  }
}

// 获取使用该词性的词汇数量
function getWordCount(key: string): number {
  return adminStore.words.filter(w => w.pos === key).length
}
</script>
