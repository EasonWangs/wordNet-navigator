<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 mb-6">数据管理</h2>

    <!-- 项目管理区域 -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 mb-6 border border-blue-200">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span class="text-2xl">📁</span>
          <span>项目管理</span>
        </h3>
        <button
          @click="showCreateProjectDialog = true"
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm flex items-center gap-2"
        >
          <span>+</span>
          <span>新建项目</span>
        </button>
      </div>

      <!-- 当前项目 -->
      <div v-if="currentProject" class="bg-white rounded-lg p-4 mb-4 shadow-sm border-2 border-blue-300">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs bg-blue-500 text-white px-2 py-0.5 rounded font-medium">当前项目</span>
              <span class="font-semibold text-gray-900">{{ currentProject.name }}</span>
            </div>
            <p v-if="currentProject.description" class="text-sm text-gray-600 mb-2">{{ currentProject.description }}</p>
            <div class="text-xs text-gray-500 space-y-1">
              <div>词汇: {{ currentProject.data.words.length }} | 关系: {{ currentProject.data.connections.length }}</div>
              <div>更新时间: {{ formatDate(currentProject.updatedAt) }}</div>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              v-if="currentProjectHasUnsavedChanges"
              @click="saveCurrentProject"
              class="px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
              title="保存当前工作到项目"
            >
              💾 保存
            </button>
            <button
              @click="editingProject = currentProject; showRenameDialog = true"
              class="px-3 py-1.5 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
              title="重命名项目"
            >
              ✏️ 重命名
            </button>
          </div>
        </div>
      </div>

      <!-- 项目列表 -->
      <div v-if="projects.length > 0" class="space-y-2">
        <p class="text-sm text-gray-600 mb-2">所有项目 ({{ projects.length }})</p>
        <div class="max-h-60 overflow-y-auto space-y-2 pr-2">
          <div
            v-for="project in projects"
            :key="project.id"
            class="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border"
            :class="project.id === currentProjectId ? 'border-blue-300 bg-blue-50' : 'border-gray-200'"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h4 class="font-medium text-gray-900 truncate">{{ project.name }}</h4>
                  <span v-if="project.id === currentProjectId" class="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">活动</span>
                </div>
                <p v-if="project.description" class="text-xs text-gray-600 mb-1 line-clamp-2">{{ project.description }}</p>
                <div class="text-xs text-gray-500">
                  <span>词汇: {{ project.data.words.length }}</span>
                  <span class="mx-1">|</span>
                  <span>关系: {{ project.data.connections.length }}</span>
                  <span class="mx-1">|</span>
                  <span>{{ formatDate(project.updatedAt) }}</span>
                </div>
              </div>
              <div class="flex gap-1 ml-2">
                <button
                  v-if="project.id !== currentProjectId"
                  @click="switchProject(project.id)"
                  class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors whitespace-nowrap"
                  title="切换到此项目"
                >
                  切换
                </button>
                <button
                  @click="exportProjectData(project.id)"
                  class="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                  title="导出项目"
                >
                  📤
                </button>
                <button
                  @click="confirmDeleteProject(project.id)"
                  class="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                  title="删除项目"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-8 text-gray-500">
        <p class="text-sm">暂无项目，请创建新项目或导入数据</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- 导入数据为新项目 -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">📥 导入为新项目</h3>
        <p class="text-sm text-gray-600 mb-4">
          从 JSON 文件导入数据并创建为新项目。
        </p>
        <input
          ref="importFileRef"
          type="file"
          accept=".json"
          class="hidden"
          @change="handleImportAsProject"
        />
        <button
          @click="importFileRef?.click()"
          class="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
        >
          选择 JSON 文件导入
        </button>
      </div>

      <!-- 导出当前数据 -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">📤 导出当前数据</h3>
        <p class="text-sm text-gray-600 mb-4">
          导出当前工作区数据到 JSON 文件。
        </p>
        <ul class="text-sm text-gray-600 mb-4 space-y-1 ml-4">
          <li>• 词汇: {{ adminStore.words.length }} 个</li>
          <li>• 关系: {{ adminStore.connections.length }} 条</li>
          <li>• 关系类型: {{ adminStore.relationTypes.length }} 种</li>
          <li>• 词性类型: {{ adminStore.posTypes.length }} 种</li>
        </ul>
        <button
          @click="exportCurrentData"
          class="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          导出为 JSON 文件
        </button>
      </div>

      <!-- 清空当前工作区 -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">🗑️ 清空工作区</h3>
        <p class="text-sm text-gray-600 mb-4">
          清空当前工作区的所有数据（不影响已保存的项目）。
        </p>
        <div class="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
          <p class="text-xs text-yellow-800">
            ⚠️ <strong>提醒</strong>：清空工作区不会删除已保存的项目数据。
          </p>
        </div>
        <button
          @click="clearWorkspace"
          class="w-full px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
        >
          清空工作区
        </button>
      </div>

      <!-- 数据统计 -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">📊 数据统计</h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">项目总数</span>
            <span class="text-lg font-semibold text-gray-900">{{ projects.length }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">当前词汇</span>
            <span class="text-lg font-semibold text-gray-900">{{ adminStore.words.length }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">当前关系</span>
            <span class="text-lg font-semibold text-gray-900">{{ adminStore.connections.length }}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-sm text-gray-600">存储大小</span>
            <span class="text-lg font-semibold text-gray-900">{{ getStorageSize() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建项目对话框 -->
    <div
      v-if="showCreateProjectDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showCreateProjectDialog = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">新建项目</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">项目名称 *</label>
            <input
              v-model="newProjectName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：英语词汇库"
              @keydown.enter="handleCreateProjectEnter"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">项目描述</label>
            <textarea
              v-model="newProjectDescription"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="简要描述该项目的用途..."
            ></textarea>
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p class="text-xs text-blue-800">
              💡 将从当前工作区创建新项目，包含当前所有词汇、关系和配置数据。
            </p>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button
            @click="showCreateProjectDialog = false"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            @click="createProject"
            :disabled="!newProjectName.trim()"
            class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            创建项目
          </button>
        </div>
      </div>
    </div>

    <!-- 重命名项目对话框 -->
    <div
      v-if="showRenameDialog && editingProject"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showRenameDialog = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">重命名项目</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">项目名称 *</label>
            <input
              v-model="editProjectName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              @keydown.enter="handleRenameProjectEnter"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">项目描述</label>
            <textarea
              v-model="editProjectDescription"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button
            @click="showRenameDialog = false; editingProject = null"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            @click="renameProject"
            :disabled="!editProjectName.trim()"
            class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- 切换项目确认对话框 -->
    <div
      v-if="showSwitchConfirmDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeSwitchConfirmDialog"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span class="text-2xl">⚠️</span>
          <span>切换项目确认</span>
        </h3>

        <div class="mb-6">
          <p class="text-sm text-gray-700 mb-3">
            切换到项目 <span class="font-semibold text-blue-600">{{ targetProjectName }}</span> 会加载该项目的数据到当前工作区。
          </p>

          <div v-if="hasUnsavedChanges" class="bg-yellow-50 border border-yellow-300 rounded-md p-4 mb-3">
            <p class="text-sm text-yellow-800 font-medium mb-1">⚠️ 检测到未保存的修改</p>
            <p class="text-xs text-yellow-700">
              当前工作区有未保存的修改，建议先保存再切换。
            </p>
          </div>

          <p class="text-xs text-gray-500">
            请选择如何处理当前工作区的数据：
          </p>
        </div>

        <div class="flex flex-col gap-3">
          <button
            @click="handleSwitchWithSave"
            class="w-full px-4 py-2.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <span>💾</span>
            <span>保存并切换</span>
          </button>
          <button
            @click="handleSwitchWithoutSave"
            class="w-full px-4 py-2.5 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            <span>放弃并切换</span>
          </button>
          <button
            @click="closeSwitchConfirmDialog"
            class="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/adminStore'
import { storageService, type Project } from '@/services/storageService'

const adminStore = useAdminStore()

// 项目管理状态
const projects = ref<Project[]>([])
const currentProjectId = ref<string | null>(null)
const showCreateProjectDialog = ref(false)
const showRenameDialog = ref(false)
const newProjectName = ref('')
const newProjectDescription = ref('')
const editingProject = ref<Project | null>(null)
const editProjectName = ref('')
const editProjectDescription = ref('')
const importFileRef = ref<HTMLInputElement | null>(null)

// 切换项目确认对话框
const showSwitchConfirmDialog = ref(false)
const targetSwitchProjectId = ref<string | null>(null)
const hasUnsavedChanges = ref(false)
const targetProjectName = computed(() => {
  if (!targetSwitchProjectId.value) return ''
  const project = projects.value.find(p => p.id === targetSwitchProjectId.value)
  return project?.name || ''
})

// 当前项目
const currentProject = computed(() => {
  return projects.value.find(p => p.id === currentProjectId.value) || null
})

// 当前项目是否有未保存的修改
const currentProjectHasUnsavedChanges = computed(() => {
  return storageService.hasUnsavedChanges()
})

onMounted(() => {
  loadProjects()
  adminStore.loadData()
})

// 加载项目列表
function loadProjects() {
  projects.value = storageService.getProjects()
  currentProjectId.value = storageService.getCurrentProjectId()
}

// 处理创建项目对话框的回车键
function handleCreateProjectEnter(event: KeyboardEvent) {
  // 如果是输入法组合输入（如中文拼音），不触发提交
  if (event.isComposing) {
    return
  }
  event.preventDefault()
  createProject()
}

// 创建新项目
function createProject() {
  if (!newProjectName.value.trim()) {
    alert('请输入项目名称')
    return
  }

  const project = storageService.createProjectFromCurrentData(
    newProjectName.value.trim(),
    newProjectDescription.value.trim() || undefined
  )

  loadProjects()
  showCreateProjectDialog.value = false
  newProjectName.value = ''
  newProjectDescription.value = ''

  // 如果是第一个项目，已经在 createProjectFromCurrentData 中自动设置为当前项目
  // 这里只需要刷新数据即可
  if (projects.value.length === 1) {
    alert(`项目 "${project.name}" 创建成功并已自动激活！`)
  } else {
    alert(`项目 "${project.name}" 创建成功！`)
  }
}

// 切换项目
function switchProject(projectId: string) {
  // 检查是否有未保存的修改
  hasUnsavedChanges.value = storageService.hasUnsavedChanges()

  // 如果没有未保存的修改，直接切换
  if (!hasUnsavedChanges.value) {
    if (storageService.switchToProject(projectId)) {
      currentProjectId.value = projectId
      adminStore.loadData()
      loadProjects()
      alert('项目切换成功！')
    } else {
      alert('项目切换失败')
    }
    return
  }

  // 有未保存的修改，显示确认对话框
  targetSwitchProjectId.value = projectId
  showSwitchConfirmDialog.value = true
}

// 保存并切换
function handleSwitchWithSave() {
  if (!targetSwitchProjectId.value) return

  // 先保存当前项目
  if (currentProjectId.value) {
    storageService.updateCurrentProject()
  }

  // 切换到目标项目
  if (storageService.switchToProject(targetSwitchProjectId.value)) {
    currentProjectId.value = targetSwitchProjectId.value
    adminStore.loadData()
    loadProjects()
    closeSwitchConfirmDialog()
    alert('项目已保存并切换成功！')
  } else {
    alert('项目切换失败')
  }
}

// 放弃并切换
function handleSwitchWithoutSave() {
  if (!targetSwitchProjectId.value) return

  // 直接切换到目标项目（不保存当前修改）
  if (storageService.switchToProject(targetSwitchProjectId.value)) {
    currentProjectId.value = targetSwitchProjectId.value
    adminStore.loadData()
    loadProjects()
    closeSwitchConfirmDialog()
    alert('项目切换成功！')
  } else {
    alert('项目切换失败')
  }
}

// 关闭切换确认对话框
function closeSwitchConfirmDialog() {
  showSwitchConfirmDialog.value = false
  targetSwitchProjectId.value = null
  hasUnsavedChanges.value = false
}

// 保存当前项目
function saveCurrentProject() {
  if (storageService.updateCurrentProject()) {
    loadProjects()
    alert('项目保存成功！')
  } else {
    alert('保存失败：未找到当前项目')
  }
}

// 处理重命名对话框的回车键
function handleRenameProjectEnter(event: KeyboardEvent) {
  // 如果是输入法组合输入（如中文拼音），不触发提交
  if (event.isComposing) {
    return
  }
  event.preventDefault()
  renameProject()
}

// 重命名项目
function renameProject() {
  if (!editingProject.value || !editProjectName.value.trim()) {
    return
  }

  if (storageService.renameProject(
    editingProject.value.id,
    editProjectName.value.trim(),
    editProjectDescription.value.trim() || undefined
  )) {
    loadProjects()
    showRenameDialog.value = false
    editingProject.value = null
    editProjectName.value = ''
    editProjectDescription.value = ''
    alert('项目重命名成功！')
  } else {
    alert('重命名失败')
  }
}

// 确认删除项目
function confirmDeleteProject(projectId: string) {
  const project = projects.value.find(p => p.id === projectId)
  if (!project) return

  if (!confirm(`确定要删除项目 "${project.name}" 吗？\n\n此操作不可撤销！`)) {
    return
  }

  if (storageService.deleteProject(projectId)) {
    loadProjects()
    if (projectId === currentProjectId.value) {
      adminStore.loadData()
      alert('当前项目已删除，工作区已清空')
    } else {
      alert('项目删除成功！')
    }
  } else {
    alert('删除失败')
  }
}

// 导出项目数据
function exportProjectData(projectId: string) {
  const project = storageService.exportProject(projectId)
  if (!project) {
    alert('项目不存在')
    return
  }

  const blob = new Blob([JSON.stringify(project.data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${project.name}-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)

  alert(`项目 "${project.name}" 导出成功！`)
}

// 导出当前数据
function exportCurrentData() {
  const data = storageService.exportData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `wordnet-data-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)

  alert('当前数据导出成功！')
}

// 导入为新项目
function handleImportAsProject(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  const projectName = prompt('请输入项目名称：', file.name.replace('.json', ''))
  if (!projectName) {
    target.value = ''
    return
  }

  const projectDescription = prompt('项目描述（可选）：')

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)

      // 验证数据格式
      if (!data.words || !data.connections || !data.relationTypes) {
        alert('数据格式错误：缺少必要字段')
        return
      }

      const project = storageService.importDataAsProject(
        projectName,
        data,
        projectDescription || undefined
      )

      loadProjects()

      // 如果只有一个项目，自动切换并启用
      if (projects.value.length === 1) {
        storageService.switchToProject(project.id)
        currentProjectId.value = project.id
        adminStore.loadData()
        alert(`项目 "${project.name}" 导入成功并已自动激活！\n\n词汇: ${data.words.length}\n关系: ${data.connections.length}`)
      } else {
        alert(`项目 "${project.name}" 导入成功！\n\n词汇: ${data.words.length}\n关系: ${data.connections.length}\n\n提示：点击"切换"按钮激活该项目`)
      }

      // 清空文件输入
      target.value = ''
    } catch (error) {
      console.error('Import error:', error)
      alert('导入失败：文件格式错误或数据损坏')
    }
  }

  reader.readAsText(file)
}

// 清空工作区
function clearWorkspace() {
  if (!confirm('确定要清空当前工作区吗？\n\n此操作不会删除已保存的项目。')) {
    return
  }

  storageService.clearAll()
  localStorage.removeItem('wordnet_current_project')
  currentProjectId.value = null
  adminStore.loadData()

  alert('工作区已清空！')
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 获取存储大小
function getStorageSize(): string {
  let totalSize = 0

  // 计算所有项目的大小
  projects.value.forEach(project => {
    totalSize += new Blob([JSON.stringify(project)]).size
  })

  // 加上当前工作区的大小
  const currentData = storageService.exportData()
  totalSize += new Blob([JSON.stringify(currentData)]).size

  if (totalSize < 1024) {
    return `${totalSize} B`
  } else if (totalSize < 1024 * 1024) {
    return `${(totalSize / 1024).toFixed(2)} KB`
  } else {
    return `${(totalSize / (1024 * 1024)).toFixed(2)} MB`
  }
}

// 监听编辑项目状态
import { watch } from 'vue'
watch(editingProject, (project) => {
  if (project) {
    editProjectName.value = project.name
    editProjectDescription.value = project.description || ''
  }
})
</script>
