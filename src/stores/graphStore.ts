import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GraphData, WordNode, LayoutType } from '@/types/wordnet'
import { storageService } from '@/services/storageService'

// Cookie keys for user preferences
const MAX_NODES_KEY = 'wordnet_max_nodes'
const RELATION_DEPTH_KEY = 'wordnet_relation_depth'
const LAYOUT_KEY = 'wordnet_layout'
const SHOW_DEFINITION_KEY = 'wordnet_show_definition'

// Cookie 操作辅助函数
const setCookie = (name: string, value: string, days: number = 365) => {
  try {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`
  } catch (error) {
    console.error('Failed to set cookie:', error)
  }
}

const getCookie = (name: string): string | null => {
  try {
    const nameEQ = name + '='
    const ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === ' ') c = c.substring(1, c.length)
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length))
      }
    }
  } catch (error) {
    console.error('Failed to get cookie:', error)
  }
  return null
}

export const useGraphStore = defineStore('graph', () => {
  // State
  const graphData = ref<GraphData>({ nodes: [], edges: [] })
  const selectedNode = ref<WordNode | null>(null)
  const searchQuery = ref<string>('*')
  const loading = ref<boolean>(false)
  const graphVersion = ref<number>(0)

  // 从 cookie 加载用户偏好设置，如果没有则使用默认值
  const layout = ref<LayoutType>(
    (getCookie(LAYOUT_KEY) as LayoutType) || 'cose'
  )
  const showDefinitionInNode = ref<boolean>(
    getCookie(SHOW_DEFINITION_KEY) === 'true'
  )
  const relationDepth = ref<number>(
    parseInt(getCookie(RELATION_DEPTH_KEY) || '2', 10)
  )
  const maxNodes = ref<number>(
    parseInt(getCookie(MAX_NODES_KEY) || '50', 10)
  )

  const sanitizeActiveRelations = (relations: string[]): string[] => {
    const availableRelationKeys = new Set(storageService.getRelationTypes().map(rt => rt.key))
    return Array.from(new Set(relations.filter(key => availableRelationKeys.has(key))))
  }

  const persistActiveRelations = (relations: string[]): string[] => {
    const sanitized = sanitizeActiveRelations(relations)
    storageService.saveActiveRelationsPreference(sanitized)
    return sanitized
  }

  // 从存储加载激活的关系类型
  const loadActiveRelationsFromStorage = (): string[] | null => {
    const storedPreference = storageService.getActiveRelationsPreference()
    if (!storedPreference) {
      return null
    }

    const currentSignature = storageService.getActiveRelationsSignature()
    if (!storedPreference.signature || storedPreference.signature !== currentSignature) {
      return null
    }

    const sanitized = sanitizeActiveRelations(storedPreference.relations)
    if (sanitized.length !== storedPreference.relations.length) {
      storageService.saveActiveRelationsPreference(sanitized)
    }
    return sanitized
  }

  // 获取默认激活的关系类型
  const getDefaultActiveRelations = (): string[] => {
    const relationTypes = storageService.getRelationTypes()
    // 只激活 defaultActive !== false 的关系类型
    return relationTypes
      .filter(rt => rt.defaultActive !== false)
      .map(rt => rt.key)
  }

  // 初始化 activeRelations：优先从存储加载，否则使用默认值
  const storedActiveRelations = loadActiveRelationsFromStorage()
  const activeRelations = ref<string[]>(
    storedActiveRelations !== null ? storedActiveRelations : getDefaultActiveRelations()
  )

  if (storedActiveRelations === null) {
    activeRelations.value = persistActiveRelations(activeRelations.value)
  }

  // Computed (if needed)
  const hasGraphData = computed(() => graphData.value.nodes.length > 0)

  // Actions
  function setGraphData(data: GraphData) {
    graphData.value = data
    graphVersion.value += 1
  }

  function setSelectedNode(node: WordNode | null) {
    selectedNode.value = node
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  function setLoading(isLoading: boolean) {
    loading.value = isLoading
  }

  function setLayout(newLayout: LayoutType) {
    layout.value = newLayout
    // 保存到 cookie
    setCookie(LAYOUT_KEY, newLayout)
  }

  function toggleShowDefinitionInNode() {
    showDefinitionInNode.value = !showDefinitionInNode.value
    // 保存到 cookie
    setCookie(SHOW_DEFINITION_KEY, showDefinitionInNode.value.toString())
  }

  function toggleRelation(relation: string) {
    const index = activeRelations.value.indexOf(relation)
    if (index > -1) {
      activeRelations.value.splice(index, 1)
    } else {
      activeRelations.value.push(relation)
    }
    // 保存到存储
    activeRelations.value = persistActiveRelations([...activeRelations.value])
  }

  function setActiveRelations(relations: string[]) {
    activeRelations.value = persistActiveRelations(relations)
  }

  function setRelationDepth(depth: number) {
    relationDepth.value = depth
    // 保存到 cookie
    setCookie(RELATION_DEPTH_KEY, depth.toString())
  }

  function setMaxNodes(max: number) {
    maxNodes.value = max
    // 保存到 cookie
    setCookie(MAX_NODES_KEY, max.toString())
  }

  // 重新加载默认激活关系（在关系类型更新后调用）
  function reloadActiveRelations() {
    activeRelations.value = persistActiveRelations(getDefaultActiveRelations())
  }

  return {
    // State
    graphData,
    graphVersion,
    selectedNode,
    searchQuery,
    loading,
    layout,
    activeRelations,
    showDefinitionInNode,
    relationDepth,
    maxNodes,
    // Computed
    hasGraphData,
    // Actions
    setGraphData,
    setSelectedNode,
    setSearchQuery,
    setLoading,
    setLayout,
    toggleShowDefinitionInNode,
    toggleRelation,
    setActiveRelations,
    setRelationDepth,
    setMaxNodes,
    reloadActiveRelations,
  }
})
