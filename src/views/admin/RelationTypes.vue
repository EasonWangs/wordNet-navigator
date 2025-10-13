<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900">关系类型管理</h2>
      <button
        @click="showAddDialog = true"
        class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
      >
        + 添加关系类型
      </button>
    </div>

    <!-- 关系类型列表 -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关系键</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">颜色</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">线条样式</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">说明</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="type in adminStore.relationTypes" :key="type.key">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{{ type.key }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ type.label }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div
                  class="w-8 h-8 rounded border border-gray-300 mr-2"
                  :style="{ backgroundColor: type.color }"
                />
                <span class="text-sm text-gray-600">{{ type.color }}</span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ type.lineStyle }}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ type.description || '-' }}</td>
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
        <h3 class="text-lg font-semibold mb-4">{{ editingType ? '编辑关系类型' : '添加关系类型' }}</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">名称</label>
            <input
              v-model="formData.label"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="例如: 上位词"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">颜色</label>
            <input
              v-model="formData.color"
              type="color"
              class="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">线条样式</label>
            <select
              v-model="formData.lineStyle"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
            >
              <option value="solid">实线</option>
              <option value="dashed">虚线</option>
              <option value="dotted">点线</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">说明</label>
            <textarea
              v-model="formData.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              placeholder="关系类型说明"
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
import type { StoredRelationType } from '@/services/storageService'

const adminStore = useAdminStore()
const showAddDialog = ref(false)
const editingType = ref<StoredRelationType | null>(null)
const formData = ref({
  label: '',
  color: '#3498db',
  lineStyle: 'solid' as 'solid' | 'dashed' | 'dotted',
  description: '',
})

onMounted(() => {
  adminStore.loadData()
})

function editType(type: StoredRelationType) {
  editingType.value = type
  formData.value = {
    label: type.label,
    color: type.color,
    lineStyle: type.lineStyle,
    description: type.description || '',
  }
}

function closeDialog() {
  showAddDialog.value = false
  editingType.value = null
  formData.value = {
    label: '',
    color: '#3498db',
    lineStyle: 'solid',
    description: '',
  }
}

function saveType() {
  if (editingType.value) {
    adminStore.updateRelationType(editingType.value.key, formData.value)
  } else {
    adminStore.addRelationType(formData.value)
  }
  closeDialog()
}

function deleteType(key: string) {
  if (confirm('确定要删除这个关系类型吗？')) {
    adminStore.deleteRelationType(key)
  }
}
</script>
