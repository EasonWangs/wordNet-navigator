<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 mb-6">数据管理</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- 导出数据 -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">📤 导出数据</h3>
        <p class="text-sm text-gray-600 mb-4">
          导出所有数据到JSON文件，包括：
        </p>
        <ul class="text-sm text-gray-600 mb-6 space-y-2 ml-4">
          <li>• <strong>词汇数据</strong>：{{ adminStore.words.length }} 个词汇</li>
          <li>• <strong>关系连接</strong>：{{ adminStore.connections.length }} 条关系</li>
          <li>• <strong>关系类型</strong>：{{ adminStore.relationTypes.length }} 种类型</li>
          <li>• <strong>词性类型</strong>：{{ adminStore.posTypes.length }} 种词性</li>
        </ul>
        <button
          @click="exportData"
          class="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          导出为 JSON 文件
        </button>
      </div>

      <!-- 导入数据 -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">📥 导入数据</h3>
        <p class="text-sm text-gray-600 mb-4">
          从JSON文件导入数据，将替换当前所有数据。
        </p>
        <div class="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
          <p class="text-xs text-yellow-800">
            ⚠️ <strong>警告</strong>：导入数据会覆盖当前所有内容，建议先导出备份！
          </p>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          accept=".json"
          class="hidden"
          @change="handleFileChange"
        />
        <button
          @click="triggerFileInput"
          class="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
        >
          选择 JSON 文件导入
        </button>
      </div>

      <!-- 清空数据 -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">🗑️ 清空数据</h3>
        <p class="text-sm text-gray-600 mb-4">
          清空所有数据，包括词汇、关系、关系类型和词性配置。
        </p>
        <div class="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p class="text-xs text-red-800">
            ⚠️ <strong>危险操作</strong>：将清空所有数据和配置，此操作不可撤销，建议先导出备份！
          </p>
        </div>
        <button
          @click="clearAllData"
          class="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          清空所有数据
        </button>
      </div>

      <!-- 数据统计 -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">📊 数据统计</h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">总词汇数</span>
            <span class="text-lg font-semibold text-gray-900">{{ adminStore.words.length }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">总关系数</span>
            <span class="text-lg font-semibold text-gray-900">{{ adminStore.connections.length }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">关系类型</span>
            <span class="text-lg font-semibold text-gray-900">{{ adminStore.relationTypes.length }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">词性类型</span>
            <span class="text-lg font-semibold text-gray-900">{{ adminStore.posTypes.length }}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-sm text-gray-600">存储大小</span>
            <span class="text-lg font-semibold text-gray-900">{{ getStorageSize() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminStore } from '@/stores/adminStore'
import { storageService } from '@/services/storageService'

const adminStore = useAdminStore()
const fileInputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  adminStore.loadData()
})

// 导出数据
function exportData() {
  const data = storageService.exportData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `wordnet-data-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)

  alert(`数据导出成功！\n\n包含：\n• ${data.words.length} 个词汇\n• ${data.connections.length} 条关系\n• ${data.relationTypes.length} 种关系类型\n• ${data.posTypes.length} 种词性类型`)
}

// 触发文件选择
function triggerFileInput() {
  fileInputRef.value?.click()
}

// 处理文件选择
function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)

      // 验证数据格式
      if (!data.words || !data.connections || !data.relationTypes) {
        alert('数据格式错误：缺少必要字段')
        return
      }

      if (!confirm(`确定要导入数据吗？\n\n将导入：\n• ${data.words.length} 个词汇\n• ${data.connections.length} 条关系\n• ${data.relationTypes.length} 种关系类型\n• ${data.posTypes?.length || 0} 种词性类型\n\n这将覆盖当前所有数据！`)) {
        return
      }

      // 导入数据
      storageService.importData(data)
      adminStore.loadData()

      alert('数据导入成功！')

      // 清空文件输入
      if (target) target.value = ''
    } catch (error) {
      console.error('Import error:', error)
      alert('导入失败：文件格式错误或数据损坏')
    }
  }

  reader.readAsText(file)
}

// 清空所有数据
function clearAllData() {
  if (!confirm('确定要清空所有数据吗？\n\n包括：词汇、关系、关系类型、词性配置\n\n此操作不可撤销！')) {
    return
  }

  if (!confirm('最后确认：真的要清空所有数据和配置吗？')) {
    return
  }

  storageService.clearAll()
  adminStore.loadData()

  alert('所有数据和配置已清空！')
}

// 获取存储大小
function getStorageSize(): string {
  const data = storageService.exportData()
  const sizeInBytes = new Blob([JSON.stringify(data)]).size

  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(2)} KB`
  } else {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`
  }
}
</script>
