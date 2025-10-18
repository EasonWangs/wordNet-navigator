import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import cytoscape, { type Core, type NodeSingular } from 'cytoscape'
import type { GraphData, LayoutType } from '@/types/wordnet'
import { storageService } from '@/services/storageService'

interface UseCytoscapeOptions {
  graphData: GraphData
  activeRelations: string[]
  layout: LayoutType
  showDefinitionInNode: boolean
  onNodeClick?: (nodeData: any) => void
  onBackgroundDblClick?: () => void
  onNodeDblClick?: (nodeData: any) => void
  onEdgeDblClick?: (edgeData: any) => void
  onSelectionChange?: (selectedNodes: any[]) => void
  onNodeDelete?: (nodeData: any) => void
}

export function useCytoscape(options: UseCytoscapeOptions) {
  const containerRef = ref<HTMLElement | null>(null)
  const cyInstance = ref<Core | null>(null)

  // Keyboard event handler for Delete key
  const handleKeyDown = (e: KeyboardEvent) => {
    // 支持 Delete (Windows/Linux) 和 Backspace (Mac) 键
    // Mac: Backspace 键的 e.key 是 'Backspace'
    // Windows/Linux: Delete 键的 e.key 是 'Delete'
    if ((e.key === 'Delete' || e.key === 'Backspace') && cyInstance.value) {
      const selectedNodes = cyInstance.value.nodes(':selected')
      if (selectedNodes.length > 0) {
        // 阻止 Backspace 的默认行为（页面后退）
        e.preventDefault()

        // Call onNodeDelete callback if provided
        if (options.onNodeDelete) {
          selectedNodes.forEach((node: any) => {
            options.onNodeDelete(node.data())
          })
        }
      }
    }
  }

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
      wheelSensitivity: 0.1,  // 降低滚轮灵敏度，使缩放更平滑（默认1）
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#3498db',
            label: 'data(label)',
            shape: 'ellipse',
            color: '#2c3e50',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-family': '"SF Mono", "Monaco", "Inconsolata", "Fira Code", "Fira Mono", "Roboto Mono", "Source Code Pro", "Courier New", monospace',
            'font-size': '15px',
            'font-weight': '600',
            'min-width': '60px',
            'min-height': '60px',
            width: 'label',
            height: 'label',
            'padding': '12px',
            'border-width': 2,
            'border-color': '#2980b9',
            'text-outline-width': 2,
            'text-outline-color': '#fff',
            'text-wrap': 'wrap',
            'text-max-width': '150px',
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

    // 清除现有元素
    cyInstance.value.elements().remove()

    const nodes = options.graphData.nodes
    const edges = options.graphData.edges
    const BATCH_SIZE = 500 // 每批处理500个节点

    // 如果节点数量较少,直接添加
    if (nodes.length <= BATCH_SIZE) {
      cyInstance.value.add(nodes)
      cyInstance.value.add(edges)

      // 设置边的初始可见性
      updateEdgeVisibility()

      // 更新节点标签显示
      updateNodeLabels()

      // 选中中心词并触发详情显示
      selectCenterNode()

      runLayout()
      return
    }

    // 分批渲染大量节点
    let currentBatch = 0
    const totalBatches = Math.ceil(nodes.length / BATCH_SIZE)

    const addBatch = () => {
      const start = currentBatch * BATCH_SIZE
      const end = Math.min(start + BATCH_SIZE, nodes.length)
      const batchNodes = nodes.slice(start, end)

      // 添加当前批次的节点
      cyInstance.value?.add(batchNodes)

      currentBatch++

      if (currentBatch < totalBatches) {
        // 使用 requestAnimationFrame 确保不阻塞UI
        requestAnimationFrame(addBatch)
      } else {
        // 所有节点添加完成,添加边
        cyInstance.value?.add(edges)

        // 设置边的初始可见性
        updateEdgeVisibility()

        // 更新节点标签显示
        updateNodeLabels()

        // 选中中心词并触发详情显示
        selectCenterNode()

        // 运行布局
        runLayout()
      }
    }

    // 开始分批添加
    addBatch()
  }

  // 选中中心词的辅助函数
  const selectCenterNode = () => {
    if (!cyInstance.value) return

    const centerNodes = cyInstance.value.nodes().filter((node: any) => node.data('isCenter') === true)
    if (centerNodes.length > 0) {
      const centerNode = centerNodes[0]
      centerNode.select()
      if (options.onNodeClick) {
        options.onNodeClick(centerNode.data())
      }
    }
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
      // 获取关系类型配置
      const relationTypes = storageService.getRelationTypes()

      // 创建边长度函数，根据关系类型返回不同的理想长度
      const idealEdgeLengthFn = (edge: any) => {
        const relation = edge.data('relation')
        const relationType = relationTypes.find(rt => rt.key === relation)
        return relationType?.edgeLength || 100
      }

      // 性能优化：根据节点数量动态调整布局参数
      const nodeCount = cyInstance.value?.nodes().length || 0
      const edgeCount = cyInstance.value?.edges().length || 0

      // 如果节点很多但边很少（孤立节点多），降低迭代次数和排斥力
      const isLowConnectivity = nodeCount > 200 && edgeCount < 50

      Object.assign(layoutOptions, {
        nodeRepulsion: isLowConnectivity ? 4000 : 8000,  // 孤立节点多时降低排斥力
        idealEdgeLength: idealEdgeLengthFn,
        edgeElasticity: 100,
        numIter: isLowConnectivity ? 500 : 1000,  // 孤立节点多时减少迭代次数
        gravity: isLowConnectivity ? 0.5 : 0.25,  // 孤立节点多时增加重力，让节点更紧凑
        animate: !isLowConnectivity,  // 孤立节点多时关闭动画
        animationDuration: isLowConnectivity ? 0 : 500,
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
    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyDown)
  })

  onBeforeUnmount(() => {
    cyInstance.value?.destroy()
    // Remove keyboard event listener
    window.removeEventListener('keydown', handleKeyDown)
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

  // 更新节点标签显示（是否包含定义）
  const updateNodeLabels = () => {
    if (!cyInstance.value) return

    cyInstance.value.nodes().forEach((node: any) => {
      const data = node.data()

      // 新数据结构使用 posDefinitions 数组
      let definition = ''
      if (data.posDefinitions && data.posDefinitions.length > 0) {
        // 取第一个词性定义对的定义
        const firstDef = data.posDefinitions[0].definition
        if (firstDef) {
          definition = firstDef
        }
      }

      if (options.showDefinitionInNode && definition) {
        // 显示：词汇\n定义（限制长度）
        const truncatedDef = definition.length > 40
          ? definition.substring(0, 40) + '...'
          : definition
        node.style('label', `${data.label}\n${truncatedDef}`)
        node.style('font-size', '12px')
        node.style('text-max-width', '180px')
        node.style('min-width', '80px')
        node.style('min-height', '80px')
      } else {
        // 只显示词汇
        node.style('label', data.label)
        node.style('font-size', '15px')
        node.style('text-max-width', '150px')
        node.style('min-width', '60px')
        node.style('min-height', '60px')
      }
    })
  }

  // Watch showDefinitionInNode changes
  watch(
    () => options.showDefinitionInNode,
    () => {
      updateNodeLabels()
    }
  )

  // 从图表中移除节点
  const removeNode = (nodeId: string) => {
    if (!cyInstance.value) return

    const node = cyInstance.value.getElementById(nodeId)
    if (node && node.isNode()) {
      // 移除节点（会自动移除相关的边）
      node.remove()
    }
  }

  // 批量移除多个节点
  const removeNodes = (nodeIds: string[]) => {
    if (!cyInstance.value) return

    nodeIds.forEach(nodeId => {
      const node = cyInstance.value!.getElementById(nodeId)
      if (node && node.isNode()) {
        node.remove()
      }
    })
  }

  return {
    containerRef,
    cyInstance,
    fitView,
    exportPNG,
    updateNodeData,
    removeNode,
    removeNodes,
  }
}
