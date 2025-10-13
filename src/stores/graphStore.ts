import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { GraphData, WordNode, RelationType, LayoutType } from '@/types/wordnet'

export const useGraphStore = defineStore('graph', () => {
  // State
  const graphData = ref<GraphData>({ nodes: [], edges: [] })
  const selectedNode = ref<WordNode | null>(null)
  const searchQuery = ref<string>('dog')
  const loading = ref<boolean>(false)
  const layout = ref<LayoutType>('cose')
  const activeRelations = ref<RelationType[]>([
    'hypernym',
    'hyponym',
    'synonym',
    'antonym',
    'meronym',
    'holonym',
  ])

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

  function toggleRelation(relation: RelationType) {
    const index = activeRelations.value.indexOf(relation)
    if (index > -1) {
      activeRelations.value.splice(index, 1)
    } else {
      activeRelations.value.push(relation)
    }
  }

  function setActiveRelations(relations: RelationType[]) {
    activeRelations.value = relations
  }

  return {
    // State
    graphData,
    selectedNode,
    searchQuery,
    loading,
    layout,
    activeRelations,
    // Computed
    hasGraphData,
    // Actions
    setGraphData,
    setSelectedNode,
    setSearchQuery,
    setLoading,
    setLayout,
    toggleRelation,
    setActiveRelations,
  }
})
