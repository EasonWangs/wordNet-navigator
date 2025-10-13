import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import cytoscape, { type Core, type NodeSingular } from 'cytoscape'
import type { GraphData, LayoutType, RelationType } from '@/types/wordnet'
import { relationConfig } from '@/utils/relationConfig'

interface UseCytoscapeOptions {
  graphData: GraphData
  activeRelations: RelationType[]
  layout: LayoutType
  onNodeClick?: (nodeData: any) => void
}

export function useCytoscape(options: UseCytoscapeOptions) {
  const containerRef = ref<HTMLElement | null>(null)
  const cyInstance = ref<Core | null>(null)

  const initCytoscape = () => {
    if (!containerRef.value) return

    const cy = cytoscape({
      container: containerRef.value,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#3498db',
            label: 'data(label)',
            color: '#2c3e50',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '12px',
            'font-weight': 'bold',
            width: '60px',
            height: '60px',
            'border-width': 2,
            'border-color': '#2980b9',
            'text-outline-width': 2,
            'text-outline-color': '#fff',
          },
        },
        {
          selector: 'node:selected',
          style: {
            'background-color': '#e74c3c',
            'border-color': '#c0392b',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.5,
          },
        },
        ...Object.entries(relationConfig).map(([rel, config]) => ({
          selector: `edge[relation="${rel}"]`,
          style: {
            'line-color': config.color,
            'target-arrow-color': config.color,
            'line-style': config.lineStyle,
          },
        })),
      ],
      minZoom: 0.3,
      maxZoom: 3,
    })

    // Node click handler
    cy.on('tap', 'node', (e: any) => {
      const node = e.target as NodeSingular
      if (options.onNodeClick) {
        options.onNodeClick(node.data())
      }
    })

    cyInstance.value = cy
  }

  const updateGraph = () => {
    if (!cyInstance.value) return

    const filteredEdges = options.graphData.edges.filter((edge) =>
      options.activeRelations.includes(edge.data.relation)
    )

    cyInstance.value.elements().remove()
    cyInstance.value.add(options.graphData.nodes)
    cyInstance.value.add(filteredEdges)

    runLayout()
  }

  const runLayout = () => {
    if (!cyInstance.value) return

    const layoutOptions: any = {
      name: options.layout,
      animate: true,
      animationDuration: 500,
    }

    if (options.layout === 'cose') {
      Object.assign(layoutOptions, {
        nodeRepulsion: 8000,
        idealEdgeLength: 100,
        edgeElasticity: 100,
      })
    }

    cyInstance.value.layout(layoutOptions).run()
  }

  const fitView = () => {
    cyInstance.value?.fit(undefined, 50)
  }

  const exportPNG = () => {
    if (!cyInstance.value) return

    const png = cyInstance.value.png({
      output: 'blob',
      bg: '#ffffff',
      full: true,
      scale: 2,
    }) as Blob

    const url = URL.createObjectURL(png)
    const link = document.createElement('a')
    link.href = url
    link.download = `wordnet-${Date.now()}.png`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Lifecycle
  onMounted(() => {
    initCytoscape()
    updateGraph()
  })

  onBeforeUnmount(() => {
    cyInstance.value?.destroy()
  })

  // Watch for changes
  watch(
    () => options.graphData,
    (newData) => {
      if (newData.nodes.length > 0) {
        updateGraph()
      }
    },
    { deep: true }
  )

  watch(
    () => options.activeRelations,
    () => {
      if (options.graphData.nodes.length > 0) {
        updateGraph()
      }
    },
    { deep: true }
  )

  watch(
    () => options.layout,
    () => {
      runLayout()
    }
  )

  return {
    containerRef,
    cyInstance,
    fitView,
    exportPNG,
  }
}
