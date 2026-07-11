import type { GraphData } from '@/types/wordnet'
import { storageService } from './storageService'
import { getSymmetricRelationTypes } from '@/utils/relationUtils'

export class WordNetService {

  // Fetch word graph from LocalStorage
  static async fetchWordGraph(word: string, maxDepth: number = 2, maxNodes: number = 50): Promise<GraphData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Get all words and connections from storage
        const allWords = storageService.getWords()
        const allConnections = storageService.getConnections()
        const symmetricTypes = getSymmetricRelationTypes()

        // 构建邻接表（节点ID -> 与其相连的所有连接），BFS 和边缘节点检测都基于它，
        // 避免每个节点都全量扫描 allConnections
        const adjacency = new Map<string, typeof allConnections>()
        allConnections.forEach((conn) => {
          if (!adjacency.has(conn.source)) adjacency.set(conn.source, [])
          adjacency.get(conn.source)!.push(conn)
          if (conn.target !== conn.source) {
            if (!adjacency.has(conn.target)) adjacency.set(conn.target, [])
            adjacency.get(conn.target)!.push(conn)
          }
        })

        // If word is empty or "*", return limited data (智能分区)
        if (!word || word.trim() === '' || word === '*') {
          // 性能优化：显示全部时限制节点数量
          const MAX_NODES_ALL = maxNodes // 使用传入的最大节点数参数

          // 统计每个节点的关系数量，用于排序
          const connectionCounts = new Map<string, number>()
          allConnections.forEach(conn => {
            connectionCounts.set(conn.source, (connectionCounts.get(conn.source) || 0) + 1)
            connectionCounts.set(conn.target, (connectionCounts.get(conn.target) || 0) + 1)
          })

          // 优先显示有连接的节点（按关系数量从多到少排序）
          const connectedNodeIds = new Set<string>()
          allConnections.forEach(c => {
            connectedNodeIds.add(c.source)
            connectedNodeIds.add(c.target)
          })

          // 分类节点：有连接的节点 + 孤立节点
          const connectedWords = allWords
            .filter(w => connectedNodeIds.has(w.id))
            .sort((a, b) => {
              const degreeA = connectionCounts.get(a.id) || 0
              const degreeB = connectionCounts.get(b.id) || 0
              if (degreeA !== degreeB) {
                return degreeB - degreeA
              }
              return a.label.localeCompare(b.label)
            })

          const isolatedWords = allWords
            .filter(w => !connectedNodeIds.has(w.id))
            .sort((a, b) => a.label.localeCompare(b.label))

          // 优先展示有连接的节点，不足时用孤立节点补全到1000个
          const connectedToShow = Math.min(connectedWords.length, MAX_NODES_ALL)
          const isolatedToShow = Math.min(isolatedWords.length, MAX_NODES_ALL - connectedToShow)

          const limitedWords = [
            ...connectedWords.slice(0, connectedToShow),
            ...isolatedWords.slice(0, isolatedToShow)
          ]

          const limitedNodeIds = new Set(limitedWords.map(w => w.id))

          // 检测边缘节点（有未显示关联的节点）
          const nodesWithMore = new Set<string>()
          limitedNodeIds.forEach(nodeId => {
            const hasMoreConnections = (adjacency.get(nodeId) || []).some(c =>
              !limitedNodeIds.has(c.source === nodeId ? c.target : c.source)
            )
            if (hasMoreConnections) {
              nodesWithMore.add(nodeId)
            }
          })

          const nodes = limitedWords.map((w) => ({
            data: {
              id: w.id,
              label: w.label,
              phonetic: w.phonetic,
              posDefinitions: w.posDefinitions,
              examples: w.examples,
              hasMore: nodesWithMore.has(w.id), // 标记是否还有未显示的关联
            },
          }))

          // 为有 hasMore 标记的节点创建虚拟"+"节点
          const moreNodes: any[] = []
          const moreEdges: any[] = []
          nodesWithMore.forEach(nodeId => {
            // 创建虚拟"+"节点
            moreNodes.push({
              data: {
                id: `${nodeId}_more`,
                label: '+',
                isMoreNode: true, // 标记为虚拟节点
              }
            })
            // 创建连接边
            moreEdges.push({
              data: {
                source: nodeId,
                target: `${nodeId}_more`,
                relation: 'more', // 特殊关系类型
              }
            })
          })

          // 只显示限制节点之间的边
          const filteredEdges = allConnections.filter((c) => {
            if (!limitedNodeIds.has(c.source) || !limitedNodeIds.has(c.target)) {
              return false
            }

            // 对于对称关系（自己配对自己），只保留源ID < 目标ID的边，避免显示双向箭头
            if (symmetricTypes.has(c.relation)) {
              return c.source < c.target
            }
            return true
          })

          const edges = filteredEdges.map((c) => ({
            data: {
              source: c.source,
              target: c.target,
              relation: c.relation,
            },
          }))

          resolve({
            nodes: [...nodes, ...moreNodes],
            edges: [...edges, ...moreEdges]
          })
          return
        }

        // Find all target words with the same label (支持重复词汇)
        const targetWords = allWords.filter((w) => w.label.toLowerCase() === word.toLowerCase())

        if (targetWords.length === 0) {
          // If word not found, return empty graph
          resolve({ nodes: [], edges: [] })
          return
        }

        // Build graph: include the target words and all connected words
        const visitedWords = new Set<string>()
        const nodesToInclude = new Set<string>()
        const edgesToInclude = new Set<string>()
        const nodeDepths = new Map<string, number>() // 记录每个节点的深度

        // BFS to find all connected words (可配置深度)
        // 将所有同名词汇作为起点加入队列
        const queue: Array<{ id: string; level: number }> = []
        targetWords.forEach(targetWord => {
          queue.push({ id: targetWord.id, level: 0 })
          visitedWords.add(targetWord.id)
          nodesToInclude.add(targetWord.id)
          nodeDepths.set(targetWord.id, 0)
        })

        // 用下标出队代替 shift()，避免每次出队都整体移动数组
        let queueHead = 0
        while (queueHead < queue.length) {
          const { id, level } = queue[queueHead++]

          if (level < maxDepth) {
            // 邻接表中同时包含该节点的出边和入边
            const connections = adjacency.get(id) || []
            connections.forEach((conn) => {
              edgesToInclude.add(conn.id)
              const neighbor = conn.source === id ? conn.target : conn.source
              if (!visitedWords.has(neighbor)) {
                visitedWords.add(neighbor)
                nodesToInclude.add(neighbor)
                nodeDepths.set(neighbor, level + 1)
                queue.push({ id: neighbor, level: level + 1 })
              }
            })
          }
        }

        // 检测边缘节点（达到最大深度的节点是否还有未显示的关联）
        const nodesWithMore = new Set<string>()
        nodesToInclude.forEach(nodeId => {
          const depth = nodeDepths.get(nodeId) || 0
          // 如果节点处于最大深度，检查是否还有未包含的关联
          if (depth === maxDepth) {
            const hasMoreConnections = (adjacency.get(nodeId) || []).some(c =>
              !nodesToInclude.has(c.source === nodeId ? c.target : c.source)
            )
            if (hasMoreConnections) {
              nodesWithMore.add(nodeId)
            }
          }
        })

        // Build the graph data
        // 创建中心词ID集合，用于标记
        const centerWordIds = new Set(targetWords.map(w => w.id))

        const nodes = allWords
          .filter((w) => nodesToInclude.has(w.id))
          .map((w) => ({
            data: {
              id: w.id,
              label: w.label,
              phonetic: w.phonetic,
              posDefinitions: w.posDefinitions,
              examples: w.examples,
              isCenter: centerWordIds.has(w.id), // 标记所有同名的中心词
              hasMore: nodesWithMore.has(w.id), // 标记是否还有未显示的关联
            },
          }))

        // 为有 hasMore 标记的节点创建虚拟"+"节点
        const moreNodes: any[] = []
        const moreEdges: any[] = []
        nodesWithMore.forEach(nodeId => {
          // 创建虚拟"+"节点
          moreNodes.push({
            data: {
              id: `${nodeId}_more`,
              label: '+',
              isMoreNode: true, // 标记为虚拟节点
            }
          })
          // 创建连接边
          moreEdges.push({
            data: {
              source: nodeId,
              target: `${nodeId}_more`,
              relation: 'more', // 特殊关系类型
            }
          })
        })

        // 过滤对称关系，只显示单向关系
        const filteredEdges = allConnections.filter((c) => {
          if (!edgesToInclude.has(c.id)) return false

          // 对于对称关系（自己配对自己），只保留源ID < 目标ID的边，避免显示双向箭头
          if (symmetricTypes.has(c.relation)) {
            return c.source < c.target
          }
          return true
        })

        const edges = filteredEdges.map((c) => ({
          data: {
            source: c.source,
            target: c.target,
            relation: c.relation,
          },
        }))

        resolve({
          nodes: [...nodes, ...moreNodes],
          edges: [...edges, ...moreEdges]
        })
      }, 300)
    })
  }

  // Get all available words for search
  static getAllWords(): string[] {
    return storageService.getWords().map((w) => w.label)
  }

  // Expand a specific node to get its direct connections
  static async expandNode(nodeId: string, excludeNodeIds: Set<string>): Promise<GraphData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allWords = storageService.getWords()
        const allConnections = storageService.getConnections()
        const symmetricTypes = getSymmetricRelationTypes()

        // 找到直接连接到该节点的所有节点
        const connectedNodeIds = new Set<string>()
        const newEdges = new Set<string>()

        // 查找出边
        allConnections.forEach((conn) => {
          if (conn.source === nodeId && !excludeNodeIds.has(conn.target)) {
            connectedNodeIds.add(conn.target)
            newEdges.add(conn.id)
          }
        })

        // 查找入边
        allConnections.forEach((conn) => {
          if (conn.target === nodeId && !excludeNodeIds.has(conn.source)) {
            connectedNodeIds.add(conn.source)
            newEdges.add(conn.id)
          }
        })

        // 构建新节点数据
        const nodes = allWords
          .filter((w) => connectedNodeIds.has(w.id))
          .map((w) => ({
            data: {
              id: w.id,
              label: w.label,
              phonetic: w.phonetic,
              posDefinitions: w.posDefinitions,
              examples: w.examples,
              hasMore: false, // 新扩展的节点暂不检测是否还有更多
            },
          }))

        // 构建边数据，过滤对称关系
        const edges = allConnections
          .filter((c) => {
            if (!newEdges.has(c.id)) return false

            // 对于对称关系，只保留源ID < 目标ID的边
            if (symmetricTypes.has(c.relation)) {
              return c.source < c.target
            }
            return true
          })
          .map((c) => ({
            data: {
              source: c.source,
              target: c.target,
              relation: c.relation,
            },
          }))

        resolve({ nodes, edges })
      }, 100)
    })
  }
}
