import type { WordNode, WordEdge, RelationType } from '@/types/wordnet'
import { relationConfig } from '@/utils/relationConfig'

const STORAGE_KEYS = {
  WORDS: 'wordnet_words',
  CONNECTIONS: 'wordnet_connections',
  RELATION_TYPES: 'wordnet_relation_types',
  POS_TYPES: 'wordnet_pos_types',
}

export interface StoredWord extends WordNode {
  id: string
  createdAt: string
  updatedAt: string
}

export interface StoredConnection extends WordEdge {
  id: string
  createdAt: string
}

export type ArrowStyle = 'filled' | 'hollow' | 'line' | 'none'

export interface StoredRelationType {
  key: string  // 改为 string 以支持自定义关系键
  label: string
  color: string
  lineStyle: 'solid' | 'dashed' | 'dotted'
  arrowStyle: ArrowStyle  // 箭头样式：实心、空心、线条、无箭头
  edgeLength?: number  // 边长度（用于力导向布局），默认 100
  description?: string
  pairWith?: string  // 配对关系键：可以是其他关系键、自己的键、或不配对（undefined）
}

export interface StoredPosType {
  key: string  // 词性键，如 noun, verb, adj 等
  label: string  // 中文名称，如"名词"、"动词"等
  abbreviation?: string  // 缩写，如 n., v., adj. 等
  description?: string  // 说明
}

class StorageService {
  // 关系类型管理
  getRelationTypes(): StoredRelationType[] {
    const stored = localStorage.getItem(STORAGE_KEYS.RELATION_TYPES)
    if (stored) {
      return JSON.parse(stored)
    }
    // 初始化默认关系类型（包含配对关系和箭头样式）
    const defaults: StoredRelationType[] = Object.entries(relationConfig).map(([key, config]) => {
      // 默认配对关系映射
      const defaultPairMap: Record<string, string> = {
        hypernym: 'hyponym',
        hyponym: 'hypernym',
        synonym: 'synonym',
        antonym: 'antonym',
        holonym: 'meronym',
        meronym: 'holonym',
      }

      // 默认箭头样式映射
      const defaultArrowMap: Record<string, ArrowStyle> = {
        hypernym: 'filled',
        hyponym: 'filled',
        synonym: 'line',
        antonym: 'line',
        holonym: 'hollow',
        meronym: 'hollow',
      }

      return {
        key: key as RelationType,
        label: config.label,
        color: config.color,
        lineStyle: config.lineStyle,
        arrowStyle: defaultArrowMap[key] || 'filled',
        edgeLength: 100,  // 所有关系类型的默认边长度统一设置为 100
        pairWith: defaultPairMap[key],
      }
    })
    this.saveRelationTypes(defaults)
    return defaults
  }

  saveRelationTypes(types: StoredRelationType[]): void {
    localStorage.setItem(STORAGE_KEYS.RELATION_TYPES, JSON.stringify(types))
  }

  addRelationType(type: StoredRelationType): StoredRelationType {
    const types = this.getRelationTypes()
    types.push(type)
    this.saveRelationTypes(types)
    return type
  }

  updateRelationType(key: string, updates: Partial<StoredRelationType>): void {
    const types = this.getRelationTypes()
    const index = types.findIndex((t) => t.key === key)
    if (index !== -1) {
      types[index] = { ...types[index], ...updates }
      this.saveRelationTypes(types)
    }
  }

  deleteRelationType(key: string): void {
    const types = this.getRelationTypes()
    const filtered = types.filter((t) => t.key !== key)
    this.saveRelationTypes(filtered)
  }

  // 词性类型管理
  getPosTypes(): StoredPosType[] {
    const stored = localStorage.getItem(STORAGE_KEYS.POS_TYPES)
    if (stored) {
      return JSON.parse(stored)
    }
    // 初始化默认词性类型
    const defaults: StoredPosType[] = [
      { key: 'noun', label: '名词', abbreviation: 'n.', description: '表示人、事物、地点或抽象概念' },
      { key: 'verb', label: '动词', abbreviation: 'v.', description: '表示动作或状态' },
      { key: 'adjective', label: '形容词', abbreviation: 'adj.', description: '描述或修饰名词' },
      { key: 'adverb', label: '副词', abbreviation: 'adv.', description: '修饰动词、形容词或其他副词' },
      { key: 'conjunction', label: '连词', abbreviation: 'conj.', description: '连接词、短语或句子' },
      { key: 'preposition', label: '介词', abbreviation: 'prep.', description: '表示名词与其他词的关系' },
      { key: 'pronoun', label: '代词', abbreviation: 'pron.', description: '代替名词或名词短语' },
      { key: 'interjection', label: '感叹词', abbreviation: 'int.', description: '表达情感或感叹' },
      { key: 'verb_transitive', label: '及物动词', abbreviation: 'vt.', description: '需要宾语的动词' },
      { key: 'verb_intransitive', label: '不及物动词', abbreviation: 'vi.', description: '不需要宾语的动词' },
    ]
    this.savePosTypes(defaults)
    return defaults
  }

  savePosTypes(types: StoredPosType[]): void {
    localStorage.setItem(STORAGE_KEYS.POS_TYPES, JSON.stringify(types))
  }

  addPosType(type: StoredPosType): StoredPosType {
    const types = this.getPosTypes()
    types.push(type)
    this.savePosTypes(types)
    return type
  }

  updatePosType(key: string, updates: Partial<StoredPosType>): void {
    const types = this.getPosTypes()
    const index = types.findIndex((t) => t.key === key)
    if (index !== -1) {
      types[index] = { ...types[index], ...updates }
      this.savePosTypes(types)
    }
  }

  // 更新词性类型的键（同时迁移所有词汇）
  updatePosTypeKey(oldKey: string, newKey: string, updates: Partial<StoredPosType>): void {
    const types = this.getPosTypes()
    const words = this.getWords()

    // 更新所有使用旧词性键的词汇
    words.forEach(word => {
      if (word.posDefinitions && word.posDefinitions.length > 0) {
        word.posDefinitions.forEach(pd => {
          if (pd.pos === oldKey) {
            pd.pos = newKey
          }
        })
      }
    })
    this.saveWords(words)

    // 更新词性类型本身
    const index = types.findIndex((t) => t.key === oldKey)
    if (index !== -1) {
      types[index] = { ...types[index], ...updates, key: newKey }
      this.savePosTypes(types)
    }
  }

  deletePosType(key: string): void {
    const types = this.getPosTypes()
    const filtered = types.filter((t) => t.key !== key)
    this.savePosTypes(filtered)
  }

  // 词汇管理
  getWords(): StoredWord[] {
    const stored = localStorage.getItem(STORAGE_KEYS.WORDS)
    return stored ? JSON.parse(stored) : []
  }

  saveWords(words: StoredWord[]): void {
    localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(words))
  }

  addWord(word: Omit<StoredWord, 'createdAt' | 'updatedAt'>): StoredWord {
    const words = this.getWords()
    const now = new Date().toISOString()
    const newWord: StoredWord = {
      ...word,
      createdAt: now,
      updatedAt: now,
    }
    words.push(newWord)
    this.saveWords(words)
    return newWord
  }

  updateWord(id: string, updates: Partial<StoredWord>): void {
    const words = this.getWords()
    const index = words.findIndex((w) => w.id === id)
    if (index !== -1) {
      words[index] = {
        ...words[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      this.saveWords(words)
    }
  }

  deleteWord(id: string): void {
    const words = this.getWords()
    const filtered = words.filter((w) => w.id !== id)
    this.saveWords(filtered)
    // 同时删除相关的连接
    this.deleteConnectionsByWord(id)
  }

  getWordById(id: string): StoredWord | undefined {
    return this.getWords().find((w) => w.id === id)
  }

  // 词汇关系管理
  getConnections(): StoredConnection[] {
    const stored = localStorage.getItem(STORAGE_KEYS.CONNECTIONS)
    return stored ? JSON.parse(stored) : []
  }

  saveConnections(connections: StoredConnection[]): void {
    localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(connections))
  }

  addConnection(connection: Omit<StoredConnection, 'id' | 'createdAt'>): StoredConnection {
    const connections = this.getConnections()
    const id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newConnection: StoredConnection = {
      ...connection,
      id,
      createdAt: new Date().toISOString(),
    }
    connections.push(newConnection)
    this.saveConnections(connections)
    return newConnection
  }

  deleteConnection(id: string): void {
    const connections = this.getConnections()
    const filtered = connections.filter((c) => c.id !== id)
    this.saveConnections(filtered)
  }

  deleteConnectionsByWord(wordId: string): void {
    const connections = this.getConnections()
    const filtered = connections.filter((c) => c.source !== wordId && c.target !== wordId)
    this.saveConnections(filtered)
  }

  updateConnection(id: string, updates: Partial<StoredConnection>): void {
    const connections = this.getConnections()
    const index = connections.findIndex((c) => c.id === id)
    if (index !== -1) {
      connections[index] = {
        ...connections[index],
        ...updates,
      }
      this.saveConnections(connections)
    }
  }

  // 导出/导入数据
  exportData() {
    return {
      words: this.getWords(),
      connections: this.getConnections(),
      relationTypes: this.getRelationTypes(),
      posTypes: this.getPosTypes(),
      exportedAt: new Date().toISOString(),
    }
  }

  importData(data: {
    words: StoredWord[]
    connections: StoredConnection[]
    relationTypes: StoredRelationType[]
    posTypes?: StoredPosType[]
  }): void {
    this.saveWords(data.words)
    this.saveConnections(data.connections)
    this.saveRelationTypes(data.relationTypes)
    if (data.posTypes) {
      this.savePosTypes(data.posTypes)
    }
  }

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEYS.WORDS)
    localStorage.removeItem(STORAGE_KEYS.CONNECTIONS)
    localStorage.removeItem(STORAGE_KEYS.RELATION_TYPES)
  }

  // 初始化数据（从 Mock 数据迁移）
  initializeMockData(mockData: { nodes: Array<{ data: WordNode }>; edges: Array<{ data: WordEdge }> }): void {
    // 检查是否已经初始化过
    const existingWords = this.getWords()
    if (existingWords.length > 0) {
      console.log('数据已存在，跳过初始化')
      return
    }

    const now = new Date().toISOString()

    // 转换节点数据为 StoredWord 格式
    const words: StoredWord[] = mockData.nodes.map((node) => ({
      id: node.data.id,
      label: node.data.label,
      pos: node.data.pos,
      definition: node.data.definition,
      examples: node.data.examples,
      createdAt: now,
      updatedAt: now,
    }))

    // 转换边数据为 StoredConnection 格式
    const connections: StoredConnection[] = mockData.edges.map((edge, index) => ({
      id: `conn_init_${index}_${Date.now()}`,
      source: edge.data.source,
      target: edge.data.target,
      relation: edge.data.relation,
      createdAt: now,
    }))

    // 保存到 localStorage
    this.saveWords(words)
    this.saveConnections(connections)

    console.log(`已初始化 ${words.length} 个词汇和 ${connections.length} 个关系连接`)
  }

  // 检查是否已初始化
  isInitialized(): boolean {
    return this.getWords().length > 0
  }
}

export const storageService = new StorageService()
