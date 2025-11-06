<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900">关系类型管理</h2>
      <button
        class="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
        @click="showAddDialog = true"
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
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">配对关系</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">颜色</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">线条样式</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">箭头样式</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">边长度</th>
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
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              {{ type.edgeLength || 100 }}px
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ type.description || '-' }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
              <button
                class="text-primary-600 hover:text-primary-900"
                @click="editType(type)"
              >
                编辑
              </button>
              <button
                class="text-red-600 hover:text-red-900"
                @click="deleteType(type.key)"
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
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="closeDialog"
    >
      <div class="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[90vh]">
        <div class="flex items-start justify-between border-b border-gray-100 px-5 py-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-primary-600">
              {{ editingType ? '编辑关系类型' : '添加关系类型' }}
            </p>
            <h3 class="mt-1 text-lg font-semibold text-gray-900">关系类型设置</h3>
          </div>
          <button
            type="button"
            class="text-lg leading-none text-gray-400 transition hover:text-gray-600"
            @click="closeDialog"
          >
            ×
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-5 py-4">
          <div class="grid gap-3">
          <section class="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <h4 class="mb-3 text-sm font-semibold text-gray-800">基础信息</h4>
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600">关系键 *</label>
                <input
                  v-model="formData.key"
                  :class="editingType ? 'bg-gray-100' : ''"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
                  placeholder="如 homograph，仅小写字母、数字、下划线"
                  required
                  type="text"
                />
                <p v-if="!editingType" class="mt-1 text-xs text-gray-500">用于唯一标识此关系类型。</p>
                <p v-else class="mt-1 text-xs text-orange-600">
                  修改关系键会同步更新 {{ getConnectionCount(editingType.key) }} 条历史连接。
                </p>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600">显示名称 *</label>
                <input
                  v-model="formData.label"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
                  placeholder="如 上位词"
                  required
                  type="text"
                />
              </div>
            </div>
          </section>

          <section class="rounded-xl border border-gray-100 p-4">
            <h4 class="mb-3 text-sm font-semibold text-gray-800">视觉样式</h4>
            <div class="grid gap-4 md:grid-cols-3">
              <div class="md:col-span-1">
                <label class="mb-1 block text-xs font-medium text-gray-600">颜色</label>
                <input
                  v-model="formData.color"
                  class="h-10 w-full cursor-pointer rounded-lg border border-gray-300"
                  type="color"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600">线条样式</label>
                <select
                  v-model="formData.lineStyle"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
                >
                  <option value="solid">实线</option>
                  <option value="dashed">虚线</option>
                  <option value="dotted">点线</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600">箭头样式</label>
                <select
                  v-model="formData.arrowStyle"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
                >
                  <option value="filled">实心箭头 ▶</option>
                  <option value="hollow">空心箭头 ▷</option>
                  <option value="line">线条箭头 ►</option>
                  <option value="none">无箭头 —</option>
                </select>
              </div>
            </div>

            <div class="mt-4 grid gap-3 md:grid-cols-5 md:items-center">
              <div class="md:col-span-3">
                <label class="mb-1 block text-xs font-medium text-gray-600">力导向布局边长</label>
                <input
                  v-model.number="formData.edgeLength"
                  class="w-full accent-primary-500"
                  max="300"
                  min="50"
                  step="10"
                  type="range"
                />
              </div>
              <div class="flex items-center justify-end gap-2 md:col-span-2">
                <input
                  v-model.number="formData.edgeLength"
                  class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
                  max="300"
                  min="50"
                  type="number"
                />
                <span class="text-xs text-gray-500">px</span>
              </div>
            </div>
          </section>

          <section class="rounded-xl border border-gray-100 p-4">
            <h4 class="mb-3 text-sm font-semibold text-gray-800">行为设置</h4>
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600">配对关系</label>
                <select
                  v-model="formData.pairWith"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
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
                <p class="mt-1 text-xs text-gray-500">
                  配对后，添加该关系会自动为对方添加相反方向关系。
                </p>
              </div>

              <div class="space-y-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <label class="flex items-center gap-2">
                  <input
                    v-model="formData.defaultActive"
                    class="h-4 w-4 text-primary-500 focus:ring-primary-500"
                    type="checkbox"
                  />
                  <span class="text-sm font-medium text-gray-700">默认在前台显示</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="formData.isActiveInFrontend"
                    class="h-4 w-4 text-primary-500 focus:ring-primary-500"
                    type="checkbox"
                  />
                  <span class="text-sm font-medium text-gray-700">立即在前台激活</span>
                </label>
                <p class="text-xs text-gray-500">
                  “默认显示”影响新数据；“立即激活”会更新当前前台筛选。
                </p>
              </div>
            </div>
          </section>

          <section class="rounded-xl border border-gray-100 p-4">
            <h4 class="mb-2 text-sm font-semibold text-gray-800">补充说明</h4>
            <textarea
              v-model="formData.description"
              class="min-h-[90px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
              placeholder="用于解释此关系类型的语义或使用提示"
            />
          </section>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-3">
          <button
            type="button"
            class="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100"
            @click="closeDialog"
          >
            取消
          </button>
          <button
            type="button"
            class="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-600"
            @click="saveType"
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
import { storageService } from '@/services/storageService'
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
  edgeLength: 100,
  description: '',
  pairWith: '' as string | undefined,
  defaultActive: true,
  isActiveInFrontend: true, // 前台当前激活状态
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

onMounted(async () => {
  await adminStore.loadData()
})

function editType(type: StoredRelationType) {
  editingType.value = type

  // 读取当前前台的激活状态
  const activePreference = storageService.getActiveRelationsPreference()
  const isCurrentlyActive = activePreference
    ? activePreference.relations.includes(type.key)
    : (type.defaultActive !== false) // 如果没有偏好，使用 defaultActive

  formData.value = {
    key: type.key,
    label: type.label,
    color: type.color,
    lineStyle: type.lineStyle,
    arrowStyle: type.arrowStyle || 'filled',
    edgeLength: type.edgeLength || 100,
    description: type.description || '',
    pairWith: type.pairWith,
    defaultActive: type.defaultActive !== false,  // 默认为 true
    isActiveInFrontend: isCurrentlyActive, // 前台当前激活状态
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
    edgeLength: 100,
    description: '',
    pairWith: undefined,
    defaultActive: true,
    isActiveInFrontend: true,
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

  // 更新前台激活状态
  updateFrontendActiveStatus(formData.value.key, formData.value.isActiveInFrontend)

  closeDialog()
}

// 更新前台激活状态
function updateFrontendActiveStatus(key: string, isActive: boolean) {
  const activePreference = storageService.getActiveRelationsPreference()
  let currentActiveRelations = activePreference
    ? activePreference.relations
    : storageService.getRelationTypes()
        .filter(rt => rt.defaultActive !== false)
        .map(rt => rt.key)

  // 更新激活状态
  if (isActive) {
    // 添加到激活列表
    if (!currentActiveRelations.includes(key)) {
      currentActiveRelations.push(key)
    }
  } else {
    // 从激活列表移除
    currentActiveRelations = currentActiveRelations.filter(k => k !== key)
  }

  // 保存更新后的偏好
  storageService.saveActiveRelationsPreference(currentActiveRelations)
  console.log(`🔄 已${isActive ? '激活' : '隐藏'}关系类型 "${key}"，前台将立即更新`)
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
