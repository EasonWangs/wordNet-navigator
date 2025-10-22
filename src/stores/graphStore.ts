import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GraphData, WordNode, LayoutType } from '@/types/wordnet'
import { storageService } from '@/services/storageService'

export const useGraphStore = defineStore('graph', () => {
  // State
  const graphData = ref<GraphData>({ nodes: [], edges: [] })
  const selectedNode = ref<WordNode | null>(null)
  const searchQuery = ref<string>('*')
  const loading = ref<boolean>(false)
  const layout = ref<LayoutType>('cose')
  const showDefinitionInNode = ref<boolean>(false) // 是否在节点内显示定义
  const relationDepth = ref<number>(2) // 关系层级深度，默认2层
  const maxNodes = ref<number>(50) // 最大显示节点数，默认50个

  // 动态从 LocalStorage 加载默认激活的关系类型
  const getDefaultActiveRelations = (): string[] => {
    const relationTypes = storageService.getRelationTypes()
    // 默认激活除了 hyponym 和 holonym 以外的所有关系类型
    return relationTypes
      .filter(rt => rt.key !== 'hyponym' && rt.key !== 'holonym')
      .map(rt => rt.key)
  }

  const activeRelations = ref<string[]>(getDefaultActiveRelations())

  // Computed (if needed)
  const hasGraphData = computed(() => graphData.value.nodes.length > 0)

  // Actions
  function setGraphData(data: GraphData) {
    graphData.value = data
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
  }

  function toggleShowDefinitionInNode() {
    showDefinitionInNode.value = !showDefinitionInNode.value
  }

  function toggleRelation(relation: string) {
    const index = activeRelations.value.indexOf(relation)
    if (index > -1) {
      activeRelations.value.splice(index, 1)
    } else {
      activeRelations.value.push(relation)
    }
  }

  function setActiveRelations(relations: string[]) {
    activeRelations.value = relations
  }

  function setRelationDepth(depth: number) {
    relationDepth.value = depth
  }

  function setMaxNodes(max: number) {
    maxNodes.value = max
  }

  // 重新加载默认激活关系（在关系类型更新后调用）
  function reloadActiveRelations() {
    activeRelations.value = getDefaultActiveRelations()
  }

  return {
    // State
    graphData,
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
