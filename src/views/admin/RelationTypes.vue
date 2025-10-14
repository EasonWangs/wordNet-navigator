<template>
  <div>
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold text-gray-900">关系类型管理</h2>
        <button
          @click="showAddDialog = true"
          class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
        >
          + 添加关系类型
        </button>
      </div>

      <!-- 关系配对说明 -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="text-sm font-semibold text-blue-900 mb-2">💡 关系配对说明</h3>
        <div class="text-sm text-blue-800 space-y-1">
          <p>• <strong>配对关系</strong>：可以为关系类型配置配对关系，添加关系时会自动在目标词汇添加配对关系</p>
          <p>• <strong>互逆关系</strong>：如 上位词 ↔ 下位词，添加上位词会自动添加对方的下位词</p>
          <p>• <strong>对称关系</strong>：如 同义词 ↔ 同义词，自动双向添加相同关系</p>
          <p>• <strong>不配对</strong>：选择"不配对"则该关系类型不会自动创建反向关系</p>
          <p class="text-xs text-blue-600 mt-2">⚠️ 修改配对关系后，只影响新创建的关系，已有关系不会自动更新</p>
        </div>
      </div>
    </div>

    <!-- 关系类型列表 -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关系键</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">配对关系</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">颜色</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">线条样式</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">箭头样式</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">说明</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="type in adminStore.relationTypes" :key="type.key">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{{ type.key }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ type.label }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <span v-if="getPairRelation(type.key)" class="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                ↔ {{ getPairRelation(type.key) }}
              </span>
              <span v-else class="text-gray-400 text-xs">-</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div
                  class="w-8 h-8 rounded border border-gray-300 mr-2"
                  :style="{ backgroundColor: type.color }"
                />
                <span class="text-sm text-gray-600">{{ type.color }}</span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ type.lineStyle === 'solid' ? '实线' : type.lineStyle === 'dashed' ? '虚线' : '点线' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ getArrowStyleLabel(type.arrowStyle || 'filled') }}
            </td>
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
            <label class="block text-sm font-medium text-gray-700 mb-1">关系键 <span class="text-red-500">*</span></label>
            <input
              v-model="formData.key"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              :class="{ 'bg-gray-100': editingType }"
              placeholder="例如: homograph (只能包含小写字母、数字和下划线)"
              required
            />
            <p v-if="!editingType" class="text-xs text-gray-500 mt-1">关系键用于程序识别</p>
            <p v-else class="text-xs text-orange-600 mt-1">
              ⚠️ 修改关系键会同步更新所有使用此关系的历史连接（{{ getConnectionCount(editingType.key) }} 条）
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">名称 <span class="text-red-500">*</span></label>
            <input
              v-model="formData.label"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="例如: 上位词"
              required
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
          <div class="grid grid-cols-2 gap-4">
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
              <label class="block text-sm font-medium text-gray-700 mb-1">箭头样式</label>
              <select
                v-model="formData.arrowStyle"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              >
                <option value="filled">实心箭头 ▶</option>
                <option value="hollow">空心箭头 ▷</option>
                <option value="line">线条箭头 ►</option>
                <option value="none">无箭头 —</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">配对关系</label>
            <select
              v-model="formData.pairWith"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
            >
              <option :value="undefined">不配对</option>
              <option
                v-for="type in availableRelationTypes"
                :key="type.key"
                :value="type.key"
              >
                {{ type.label }} ({{ type.key }})
              </option>
            </select>
            <p class="text-xs text-gray-500 mt-1">配对后，添加此关系会自动在目标词汇添加配对关系</p>
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
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/adminStore'
import type { StoredRelationType } from '@/services/storageService'

const adminStore = useAdminStore()
const showAddDialog = ref(false)
const editingType = ref<StoredRelationType | null>(null)
const formData = ref({
  key: '',
  label: '',
  color: '#3498db',
  lineStyle: 'solid' as 'solid' | 'dashed' | 'dotted',
  arrowStyle: 'filled' as 'filled' | 'hollow' | 'line' | 'none',
  description: '',
  pairWith: '' as string | undefined,
})

// 可用的配对关系类型列表（包括当前正在编辑的类型，排除其他正在编辑的）
const availableRelationTypes = computed(() => {
  if (editingType.value) {
    // 编辑模式：显示所有关系类型
    return adminStore.relationTypes
  } else {
    // 新增模式：显示现有的关系类型，加上当前正在创建的（如果已输入key）
    const types = [...adminStore.relationTypes]
    if (formData.value.key && formData.value.label) {
      types.push({
        key: formData.value.key,
        label: formData.value.label + ' (当前)',
        color: formData.value.color,
        lineStyle: formData.value.lineStyle,
        arrowStyle: formData.value.arrowStyle,
      })
    }
    return types
  }
})

onMounted(() => {
  adminStore.loadData()
})

function editType(type: StoredRelationType) {
  editingType.value = type
  formData.value = {
    key: type.key,
    label: type.label,
    color: type.color,
    lineStyle: type.lineStyle,
    arrowStyle: type.arrowStyle || 'filled',
    description: type.description || '',
    pairWith: type.pairWith,
  }
}

function closeDialog() {
  showAddDialog.value = false
  editingType.value = null
  formData.value = {
    key: '',
    label: '',
    color: '#3498db',
    lineStyle: 'solid',
    arrowStyle: 'filled',
    description: '',
    pairWith: undefined,
  }
}

// 获取箭头样式的中文标签
function getArrowStyleLabel(style: string): string {
  const labels: Record<string, string> = {
    filled: '实心箭头',
    hollow: '空心箭头',
    line: '线条箭头',
    none: '无箭头',
  }
  return labels[style] || style
}

function saveType() {
  // 验证关系键格式
  const keyPattern = /^[a-z0-9_]+$/
  if (!formData.value.key || !keyPattern.test(formData.value.key)) {
    alert('关系键只能包含小写字母、数字和下划线')
    return
  }

  if (!formData.value.label.trim()) {
    alert('请输入关系名称')
    return
  }

  if (editingType.value) {
    const oldKey = editingType.value.key
    const newKey = formData.value.key

    // 如果关系键发生变化
    if (oldKey !== newKey) {
      // 检查新关系键是否已存在
      if (adminStore.relationTypes.find(t => t.key === newKey)) {
        alert('该关系键已被其他关系类型使用，请使用其他关系键')
        return
      }

      const connectionCount = getConnectionCount(oldKey)
      const confirmMsg = connectionCount > 0
        ? `修改关系键会同步更新 ${connectionCount} 条历史连接。\n\n这个操作不可撤销，确定要继续吗？`
        : '确定要修改关系键吗？'

      if (!confirm(confirmMsg)) {
        return
      }

      // 更新关系类型和所有相关连接
      adminStore.updateRelationTypeKey(oldKey, newKey, formData.value)
    } else {
      // 只更新其他属性
      adminStore.updateRelationType(oldKey, formData.value)
    }
  } else {
    // 检查关系键是否已存在
    if (adminStore.relationTypes.find(t => t.key === formData.value.key)) {
      alert('该关系键已存在，请使用其他关系键')
      return
    }

    adminStore.addRelationType(formData.value)
  }
  closeDialog()
}

// 获取使用该关系键的连接数量
function getConnectionCount(key: string): number {
  return adminStore.connections.filter(c => c.relation === key).length
}

function deleteType(key: string) {
  const connectionCount = getConnectionCount(key)

  let confirmMsg = '确定要删除这个关系类型吗？'
  if (connectionCount > 0) {
    confirmMsg = `此关系类型正在被 ${connectionCount} 条连接使用。\n\n删除后这些连接也会被删除，此操作不可撤销。\n\n确定要继续吗？`
  }

  // 检查是否有其他关系类型配对到这个类型
  const pairedTypes = adminStore.relationTypes.filter(rt => rt.pairWith === key)
  if (pairedTypes.length > 0) {
    const pairedNames = pairedTypes.map(rt => rt.label).join('、')
    confirmMsg += `\n\n注意：关系类型 ${pairedNames} 配对到此类型，删除后它们的配对关系将失效。`
  }

  if (confirm(confirmMsg)) {
    // 删除所有使用该关系键的连接
    const affectedConnections = adminStore.connections.filter(c => c.relation === key)
    affectedConnections.forEach(conn => {
      adminStore.deleteConnection(conn.id)
    })

    // 清除其他关系类型对此类型的配对引用
    pairedTypes.forEach(rt => {
      adminStore.updateRelationType(rt.key, { pairWith: undefined })
    })

    // 删除关系类型
    adminStore.deleteRelationType(key)
  }
}

// 获取配对关系
function getPairRelation(key: string): string {
  const relationType = adminStore.relationTypes.find(t => t.key === key)
  if (relationType?.pairWith) {
    const pairType = adminStore.relationTypes.find(t => t.key === relationType.pairWith)
    return pairType ? pairType.label : relationType.pairWith
  }
  return ''
}
</script>
