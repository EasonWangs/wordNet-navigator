import type { GraphData } from '@/types/wordnet'
import { storageService } from './storageService'

// Mock data for initial setup
export const mockGraphData: GraphData = {
  nodes: [
    {
      data: {
        id: 'dog',
        label: 'dog',
        phonetic: '/dɒg/',
        posDefinitions: [{ pos: 'noun', definition: '驯养的食肉哺乳动物' }],
        examples: ['The dog barked loudly.', 'She walked her dog in the park.'],
      },
    },
    {
      data: {
        id: 'canine',
        label: 'canine',
        phonetic: '/ˈkeɪnaɪn/',
        posDefinitions: [{ pos: 'noun', definition: '犬科动物' }],
        examples: ['Wolves are canines.'],
      },
    },
    {
      data: {
        id: 'pooch',
        label: 'pooch',
        phonetic: '/puːtʃ/',
        posDefinitions: [{ pos: 'noun', definition: '狗（非正式用法）' }],
        examples: ['What a cute pooch!'],
      },
    },
    {
      data: {
        id: 'animal',
        label: 'animal',
        phonetic: '/ˈænɪməl/',
        posDefinitions: [{ pos: 'noun', definition: '动物' }],
        examples: ['All dogs are animals.'],
      },
    },
    {
      data: {
        id: 'mammal',
        label: 'mammal',
        phonetic: '/ˈmæməl/',
        posDefinitions: [{ pos: 'noun', definition: '哺乳动物' }],
        examples: ['Mammals nurse their young.'],
      },
    },
    {
      data: {
        id: 'puppy',
        label: 'puppy',
        phonetic: '/ˈpʌpi/',
        posDefinitions: [{ pos: 'noun', definition: '幼犬' }],
        examples: ['The puppy is so cute!'],
      },
    },
    {
      data: {
        id: 'hound',
        label: 'hound',
        phonetic: '/haʊnd/',
        posDefinitions: [{ pos: 'noun', definition: '猎犬' }],
        examples: ['The hound tracked the scent.'],
      },
    },
    {
      data: {
        id: 'bulldog',
        label: 'bulldog',
        phonetic: '/ˈbʊldɒg/',
        posDefinitions: [{ pos: 'noun', definition: '斗牛犬' }],
        examples: ['Bulldogs have a distinctive appearance.'],
      },
    },
    {
      data: {
        id: 'watchdog',
        label: 'watchdog',
        phonetic: '/ˈwɒtʃdɒg/',
        posDefinitions: [{ pos: 'noun', definition: '看门狗；监督者' }],
        examples: ['The watchdog barked at strangers.'],
      },
    },
    {
      data: {
        id: 'tail',
        label: 'tail',
        phonetic: '/teɪl/',
        posDefinitions: [{ pos: 'noun', definition: '尾巴' }],
        examples: ['The dog wagged its tail.'],
      },
    },
    {
      data: {
        id: 'paw',
        label: 'paw',
        phonetic: '/pɔː/',
        posDefinitions: [{ pos: 'noun', definition: '爪子' }],
        examples: ['The dog hurt its paw.'],
      },
    },
    {
      data: {
        id: 'cat',
        label: 'cat',
        phonetic: '/kæt/',
        posDefinitions: [{ pos: 'noun', definition: '猫' }],
        examples: ['The cat meowed.'],
      },
    },
    {
      data: {
        id: 'feline',
        label: 'feline',
        phonetic: '/ˈfiːlaɪn/',
        posDefinitions: [{ pos: 'noun', definition: '猫科动物' }],
        examples: ['Lions are felines.'],
      },
    },
  ],
  edges: [
    // Hypernym (上位词)
    { data: { source: 'dog', target: 'canine', relation: 'hypernym' } },
    { data: { source: 'canine', target: 'mammal', relation: 'hypernym' } },
    { data: { source: 'mammal', target: 'animal', relation: 'hypernym' } },
    { data: { source: 'cat', target: 'feline', relation: 'hypernym' } },
    { data: { source: 'feline', target: 'mammal', relation: 'hypernym' } },

    // Hyponym (下位词)
    { data: { source: 'dog', target: 'puppy', relation: 'hyponym' } },
    { data: { source: 'dog', target: 'hound', relation: 'hyponym' } },
    { data: { source: 'dog', target: 'bulldog', relation: 'hyponym' } },

    // Meronym (部分词)
    { data: { source: 'dog', target: 'tail', relation: 'meronym' } },
    { data: { source: 'dog', target: 'paw', relation: 'meronym' } },
    { data: { source: 'cat', target: 'tail', relation: 'meronym' } },
    { data: { source: 'cat', target: 'paw', relation: 'meronym' } },

    // Synonym (近义词)
    { data: { source: 'dog', target: 'pooch', relation: 'synonym' } },
    { data: { source: 'canine', target: 'dog', relation: 'synonym' } },

    // Compound (复合词)
    { data: { source: 'watchdog', target: 'dog', relation: 'compound' } },
  ],
}

export class WordNetService {
  // 获取对称关系类型（自己配对自己的关系）
  private static getSymmetricRelationTypes(): Set<string> {
    const relationTypes = storageService.getRelationTypes()
    const symmetricTypes = new Set<string>()

    relationTypes.forEach(rt => {
      // 如果关系配对到自己，则是对称关系
      if (rt.pairWith === rt.key) {
        symmetricTypes.add(rt.key)
      }
    })

    return symmetricTypes
  }

  // Fetch word graph from LocalStorage
  static async fetchWordGraph(word: string, maxDepth: number = 2): Promise<GraphData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Get all words and connections from storage
        const allWords = storageService.getWords()
        const allConnections = storageService.getConnections()
        const symmetricTypes = this.getSymmetricRelationTypes()

        // If word is empty or "*", return limited data (智能分区)
        if (!word || word.trim() === '' || word === '*') {
          // 性能优化：显示全部时限制节点数量
          const MAX_NODES_ALL = 500 // 最多显示500个节点

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

        // Find the target word (case-insensitive)
        const targetWord = allWords.find((w) => w.label.toLowerCase() === word.toLowerCase())

        if (!targetWord) {
          // If word not found, return empty graph
          resolve({ nodes: [], edges: [] })
          return
        }

        // Build graph: include the target word and all connected words
        const visitedWords = new Set<string>()
        const nodesToInclude = new Set<string>()
        const edgesToInclude = new Set<string>()

        // BFS to find all connected words (可配置深度)
        const queue: Array<{ id: string; level: number }> = [{ id: targetWord.id, level: 0 }]
        visitedWords.add(targetWord.id)
        nodesToInclude.add(targetWord.id)

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
        const nodes = allWords
          .filter((w) => nodesToInclude.has(w.id))
          .map((w) => ({
            data: {
              id: w.id,
              label: w.label,
              phonetic: (w as any).phonetic,
              posDefinitions: (w as any).posDefinitions,
              examples: w.examples,
              isCenter: w.id === targetWord.id, // 标记中心词
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
