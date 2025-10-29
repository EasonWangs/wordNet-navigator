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

          // 优先显示有连接的节点
          const connectedNodeIds = new Set<string>()
          allConnections.forEach(c => {
            connectedNodeIds.add(c.source)
            connectedNodeIds.add(c.target)
          })

          // 分类节点：有连接的节点 + 孤立节点
          const connectedWords = allWords.filter(w => connectedNodeIds.has(w.id))
          const isolatedWords = allWords.filter(w => !connectedNodeIds.has(w.id))

          // 优先展示有连接的节点，不足时用孤立节点补全到1000个
          const connectedToShow = Math.min(connectedWords.length, MAX_NODES_ALL)
          const isolatedToShow = Math.min(isolatedWords.length, MAX_NODES_ALL - connectedToShow)

          const limitedWords = [
            ...connectedWords.slice(0, connectedToShow),
            ...isolatedWords.slice(0, isolatedToShow)
          ]

          const limitedNodeIds = new Set(limitedWords.map(w => w.id))

          const nodes = limitedWords.map((w) => ({
            data: {
              id: w.id,
              label: w.label,
              phonetic: (w as any).phonetic,
              posDefinitions: (w as any).posDefinitions,
              examples: w.examples,
            },
          }))

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

          resolve({ nodes, edges })
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

        // BFS to find all connected words (可配置深度)
        // 将所有同名词汇作为起点加入队列
        const queue: Array<{ id: string; level: number }> = []
        targetWords.forEach(targetWord => {
          queue.push({ id: targetWord.id, level: 0 })
          visitedWords.add(targetWord.id)
          nodesToInclude.add(targetWord.id)
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
                queue.push({ id: conn.source, level: level + 1 })
              }
            })
          }
        }

        // Build the graph data
        // 创建中心词ID集合，用于标记
        const centerWordIds = new Set(targetWords.map(w => w.id))

        const nodes = allWords
          .filter((w) => nodesToInclude.has(w.id))
          .map((w) => ({
            data: {
              id: w.id,
              label: w.label,
              phonetic: (w as any).phonetic,
              posDefinitions: (w as any).posDefinitions,
              examples: w.examples,
              isCenter: centerWordIds.has(w.id), // 标记所有同名的中心词
            },
          }))

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

        resolve({ nodes, edges })
      }, 300)
    })
  }

  // Get all available words for search
  static getAllWords(): string[] {
    return storageService.getWords().map((w) => w.label)
  }
}
