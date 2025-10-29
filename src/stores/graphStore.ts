import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GraphData, WordNode, LayoutType } from '@/types/wordnet'
import { storageService } from '@/services/storageService'

// Cookie keys for user preferences
const ACTIVE_RELATIONS_KEY = 'wordnet_active_relations'
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

  // 从 cookie 加载激活的关系类型
  const loadActiveRelationsFromCache = (): string[] | null => {
    try {
      const cached = getCookie(ACTIVE_RELATIONS_KEY)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (error) {
      console.error('Failed to load active relations from cookie:', error)
    }
    return null
  }

  // 保存激活的关系类型到 cookie（有效期 1 年）
  const saveActiveRelationsToCache = (relations: string[]) => {
    try {
      setCookie(ACTIVE_RELATIONS_KEY, JSON.stringify(relations), 365)
    } catch (error) {
      console.error('Failed to save active relations to cookie:', error)
    }
  }

  // 获取默认激活的关系类型
  const getDefaultActiveRelations = (): string[] => {
    const relationTypes = storageService.getRelationTypes()
    // 默认激活所有关系类型（用户可以通过图例筛选）
    return relationTypes.map(rt => rt.key)
  }

  // 初始化 activeRelations：优先从缓存加载，否则使用默认值
  const activeRelations = ref<string[]>(
    loadActiveRelationsFromCache() || getDefaultActiveRelations()
  )

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
    // 保存到缓存
    saveActiveRelationsToCache(activeRelations.value)
  }

  function setActiveRelations(relations: string[]) {
    activeRelations.value = relations
    // 保存到缓存
    saveActiveRelationsToCache(relations)
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
    activeRelations.value = getDefaultActiveRelations()
    // 保存到缓存
    saveActiveRelationsToCache(activeRelations.value)
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
