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
            'font-size': '16px',
            'font-weight': 'bold',
            width: '70px',
            height: '70px',
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

    // Background click handler - close node detail when clicking empty space
    cy.on('tap', (e: any) => {
      // 如果点击的不是节点（即点击了背景），则关闭详情面板
      if (e.target === cy) {
        if (options.onNodeClick) {
          options.onNodeClick(null)
        }
      }
    })

    // Hover tooltip - show definition on mouseover using HTML tooltip
    let tooltipDiv: HTMLDivElement | null = null

    cy.on('mouseover', 'node', (e: any) => {
      const node = e.target as NodeSingular
      const definition = node.data('definition')

      if (definition) {
        // Create tooltip element
        if (!tooltipDiv) {
          tooltipDiv = document.createElement('div')
          tooltipDiv.style.position = 'absolute'
          tooltipDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.85)'
          tooltipDiv.style.color = 'white'
          tooltipDiv.style.padding = '8px 12px'
          tooltipDiv.style.borderRadius = '6px'
          tooltipDiv.style.fontSize = '13px'
          tooltipDiv.style.maxWidth = '300px'
          tooltipDiv.style.zIndex = '1000'
          tooltipDiv.style.pointerEvents = 'none'
          tooltipDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'
          tooltipDiv.style.backdropFilter = 'blur(4px)'
          containerRef.value?.appendChild(tooltipDiv)
        }

        tooltipDiv.textContent = definition
        tooltipDiv.style.display = 'block'

        // Position tooltip near the cursor
        const updateTooltipPosition = (evt: any) => {
          if (tooltipDiv && containerRef.value) {
            const containerRect = containerRef.value.getBoundingClientRect()
            tooltipDiv.style.left = `${evt.clientX - containerRect.left + 15}px`
            tooltipDiv.style.top = `${evt.clientY - containerRect.top + 15}px`
          }
        }

        updateTooltipPosition(e.originalEvent)
        cy.on('mousemove', updateTooltipPosition)

        node.on('mouseout', () => {
          cy.off('mousemove', updateTooltipPosition)
        })
      }
    })

    cy.on('mouseout', 'node', () => {
      if (tooltipDiv) {
        tooltipDiv.style.display = 'none'
      }
    })

    cyInstance.value = cy
  }

  const updateGraph = () => {
    if (!cyInstance.value) return

    // 添加所有节点和所有边（不过滤）
    cyInstance.value.elements().remove()
    cyInstance.value.add(options.graphData.nodes)
    cyInstance.value.add(options.graphData.edges)

    // 设置边的初始可见性
    updateEdgeVisibility()

    // 选中中心词并触发详情显示
    const centerNodes = cyInstance.value.nodes().filter((node: any) => node.data('isCenter') === true)
    if (centerNodes.length > 0) {
      const centerNode = centerNodes[0]
      centerNode.select()
      if (options.onNodeClick) {
        options.onNodeClick(centerNode.data())
      }
    }

    runLayout()
  }

  const updateEdgeVisibility = () => {
    if (!cyInstance.value) return

    // 遍历所有边，根据 activeRelations 设置可见性
    cyInstance.value.edges().forEach((edge) => {
      const relation = edge.data('relation') as RelationType
      if (options.activeRelations.includes(relation)) {
        edge.style('display', 'element')
      } else {
        edge.style('display', 'none')
      }
    })
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
      // 只更新边的可见性，不重新布局
      updateEdgeVisibility()
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
