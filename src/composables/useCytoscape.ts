import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import cytoscape, { type Core, type NodeSingular } from 'cytoscape'
import type { GraphData, LayoutType } from '@/types/wordnet'
import { storageService } from '@/services/storageService'

interface UseCytoscapeOptions {
  graphData: GraphData
  activeRelations: string[]
  layout: LayoutType
  onNodeClick?: (nodeData: any) => void
  onBackgroundDblClick?: () => void
  onNodeDblClick?: (nodeData: any) => void
  onEdgeDblClick?: (edgeData: any) => void
  onSelectionChange?: (selectedNodes: any[]) => void
}

export function useCytoscape(options: UseCytoscapeOptions) {
  const containerRef = ref<HTMLElement | null>(null)
  const cyInstance = ref<Core | null>(null)

  const initCytoscape = () => {
    if (!containerRef.value) return

    // 动态加载关系类型配置
    const relationTypes = storageService.getRelationTypes()
    const edgeStyles = relationTypes.map((rt) => {
      // 箭头形状映射
      const arrowStyle = rt.arrowStyle || 'filled'
      let arrowShape: 'triangle' | 'triangle-tee' | 'vee' | 'none' = 'triangle'
      let arrowFill: 'filled' | 'hollow' = 'filled'

      switch (arrowStyle) {
        case 'filled':
          arrowShape = 'triangle'
          arrowFill = 'filled'
          break
        case 'hollow':
          arrowShape = 'triangle'
          arrowFill = 'hollow'
          break
        case 'line':
          arrowShape = 'vee'
          arrowFill = 'filled'
          break
        case 'none':
          arrowShape = 'none'
          arrowFill = 'filled'
          break
      }

      return {
        selector: `edge[relation="${rt.key}"]`,
        style: {
          'line-color': rt.color,
          'target-arrow-color': rt.color,
          'line-style': rt.lineStyle,
          'target-arrow-shape': arrowShape,
          'target-arrow-fill': arrowFill,
        },
      }
    })

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
        ...edgeStyles,
      ],
      minZoom: 0.3,
      maxZoom: 3,
    })

    // 记录节点点击顺序
    let clickedNodesOrder: string[] = []

    // Node click handler
    cy.on('tap', 'node', (e: any) => {
      const node = e.target as NodeSingular
      const nodeId = node.data().id

      // 如果是多选模式（按住 Ctrl/Cmd 或者 Shift）
      if (e.originalEvent.ctrlKey || e.originalEvent.metaKey || e.originalEvent.shiftKey) {
        // 添加到点击顺序
        if (!clickedNodesOrder.includes(nodeId)) {
          clickedNodesOrder.push(nodeId)
        }
      } else {
        // 单选模式，重置顺序
        clickedNodesOrder = [nodeId]
      }

      if (options.onNodeClick) {
        options.onNodeClick(node.data())
      }
    })


    // Double-click handlers
    cy.on('dbltap', (e: any) => {
      if (e.target === cy) {
        // 双击背景 - 添加新词汇
        if (options.onBackgroundDblClick) {
          options.onBackgroundDblClick()
        }
      } else if (e.target.isNode && e.target.isNode()) {
        // 双击节点 - 编辑词汇（不触发单击事件）
        if (options.onNodeDblClick) {
          const node = e.target as NodeSingular
          options.onNodeDblClick(node.data())
          // 阻止显示词汇详情
          e.stopPropagation()
          return false
        }
      } else if (e.target.isEdge && e.target.isEdge()) {
        // 双击边 - 编辑关系
        if (options.onEdgeDblClick) {
          const edge = e.target
          options.onEdgeDblClick(edge.data())
          e.stopPropagation()
          return false
        }
      }
    })

    // Selection change handler - notify when selection changes
    cy.on('select unselect', 'node', () => {
      if (options.onSelectionChange) {
        const selectedNodesSet = cy.nodes(':selected')

        // 清理已取消选择的节点
        const selectedIds = selectedNodesSet.map((node: any) => node.data().id)
        clickedNodesOrder = clickedNodesOrder.filter(id => selectedIds.includes(id))

        // 按点击顺序排序选中的节点
        const sortedNodes = clickedNodesOrder
          .map(id => selectedNodesSet.filter((node: any) => node.data().id === id)[0])
          .filter(node => node)
          .map((node: any) => node.data())

        options.onSelectionChange(sortedNodes)
      }
    })

    // Background click handler - clear click order and close detail when clicking background
    cy.on('tap', (e: any) => {
      if (e.target === cy) {
        clickedNodesOrder = []
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

    // Edge hover tooltip - show relation information
    let edgeTooltipDiv: HTMLDivElement | null = null

    cy.on('mouseover', 'edge', (e: any) => {
      const edge = e.target
      const edgeData = edge.data()

      // 获取源节点和目标节点的 label
      const sourceNode = cy.getElementById(edgeData.source)
      const targetNode = cy.getElementById(edgeData.target)
      const sourceLabel = sourceNode.data('label')
      const targetLabel = targetNode.data('label')

      // 获取关系类型信息
      const relationTypes = storageService.getRelationTypes()
      const relationType = relationTypes.find(rt => rt.key === edgeData.relation)
      const relationLabel = relationType ? relationType.label : edgeData.relation

      // 创建提示文本：目标词 是 源词 的 关系类型
      // 例如：边 dog->animal，关系是hypernym（上位词），显示"animal 是 dog 的上位词"
      const tooltipText = `${targetLabel} 是 ${sourceLabel} 的${relationLabel}`

      // 创建或更新 tooltip 元素
      if (!edgeTooltipDiv) {
        edgeTooltipDiv = document.createElement('div')
        edgeTooltipDiv.style.position = 'absolute'
        edgeTooltipDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.85)'
        edgeTooltipDiv.style.color = 'white'
        edgeTooltipDiv.style.padding = '8px 12px'
        edgeTooltipDiv.style.borderRadius = '6px'
        edgeTooltipDiv.style.fontSize = '13px'
        edgeTooltipDiv.style.maxWidth = '300px'
        edgeTooltipDiv.style.zIndex = '1000'
        edgeTooltipDiv.style.pointerEvents = 'none'
        edgeTooltipDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'
        edgeTooltipDiv.style.backdropFilter = 'blur(4px)'
        containerRef.value?.appendChild(edgeTooltipDiv)
      }

      edgeTooltipDiv.textContent = tooltipText
      edgeTooltipDiv.style.display = 'block'

      // 定位 tooltip 跟随鼠标
      const updateEdgeTooltipPosition = (evt: any) => {
        if (edgeTooltipDiv && containerRef.value) {
          const containerRect = containerRef.value.getBoundingClientRect()
          edgeTooltipDiv.style.left = `${evt.clientX - containerRect.left + 15}px`
          edgeTooltipDiv.style.top = `${evt.clientY - containerRect.top + 15}px`
        }
      }

      updateEdgeTooltipPosition(e.originalEvent)
      cy.on('mousemove', updateEdgeTooltipPosition)

      edge.on('mouseout', () => {
        cy.off('mousemove', updateEdgeTooltipPosition)
      })
    })

    cy.on('mouseout', 'edge', () => {
      if (edgeTooltipDiv) {
        edgeTooltipDiv.style.display = 'none'
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
      const relation = edge.data('relation') as string
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

  const updateNodeData = (nodeId: string, newData: any) => {
    if (!cyInstance.value) return

    const node = cyInstance.value.getElementById(nodeId)
    if (node && node.isNode()) {
      // 更新节点的数据
      Object.keys(newData).forEach(key => {
        node.data(key, newData[key])
      })
    }
  }

  return {
    containerRef,
    cyInstance,
    fitView,
    exportPNG,
    updateNodeData,
  }
}
