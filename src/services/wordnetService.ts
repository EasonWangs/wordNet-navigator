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
            const hasMoreConnections = allConnections.some(c =>
              (c.source === nodeId && !limitedNodeIds.has(c.target)) ||
              (c.target === nodeId && !limitedNodeIds.has(c.source))
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

        while (queue.length > 0) {
          const { id, level } = queue.shift()!

          if (level < maxDepth) {
            // Find all connections from this word
            const outgoingConnections = allConnections.filter((c) => c.source === id)
            outgoingConnections.forEach((conn) => {
              edgesToInclude.add(conn.id)
              if (!visitedWords.has(conn.target)) {
                visitedWords.add(conn.target)
                nodesToInclude.add(conn.target)
                nodeDepths.set(conn.target, level + 1)
                queue.push({ id: conn.target, level: level + 1 })
              }
            })

            // Find all connections to this word
            const incomingConnections = allConnections.filter((c) => c.target === id)
            incomingConnections.forEach((conn) => {
              edgesToInclude.add(conn.id)
              if (!visitedWords.has(conn.source)) {
                visitedWords.add(conn.source)
                nodesToInclude.add(conn.source)
                nodeDepths.set(conn.source, level + 1)
                queue.push({ id: conn.source, level: level + 1 })
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
            const hasMoreConnections = allConnections.some(c =>
              (c.source === nodeId && !nodesToInclude.has(c.target)) ||
              (c.target === nodeId && !nodesToInclude.has(c.source))
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
}
