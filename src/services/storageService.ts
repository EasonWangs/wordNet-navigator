import type { WordNode, WordEdge, RelationType } from '@/types/wordnet'
import { relationConfig } from '@/utils/relationConfig'

const STORAGE_KEYS = {
  WORDS: 'wordnet_words',
  CONNECTIONS: 'wordnet_connections',
  RELATION_TYPES: 'wordnet_relation_types',
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

export interface StoredRelationType {
  key: RelationType
  label: string
  color: string
  lineStyle: 'solid' | 'dashed' | 'dotted'
  description?: string
}

class StorageService {
  // 关系类型管理
  getRelationTypes(): StoredRelationType[] {
    const stored = localStorage.getItem(STORAGE_KEYS.RELATION_TYPES)
    if (stored) {
      return JSON.parse(stored)
    }
    // 初始化默认关系类型
    const defaults: StoredRelationType[] = Object.entries(relationConfig).map(([key, config]) => ({
      key: key as RelationType,
      label: config.label,
      color: config.color,
      lineStyle: config.lineStyle,
    }))
    this.saveRelationTypes(defaults)
    return defaults
  }

  saveRelationTypes(types: StoredRelationType[]): void {
    localStorage.setItem(STORAGE_KEYS.RELATION_TYPES, JSON.stringify(types))
  }

  addRelationType(type: Omit<StoredRelationType, 'key'>): StoredRelationType {
    const types = this.getRelationTypes()
    const key = type.label.toLowerCase().replace(/\s+/g, '_') as RelationType
    const newType: StoredRelationType = { ...type, key }
    types.push(newType)
    this.saveRelationTypes(types)
    return newType
  }

  updateRelationType(key: RelationType, updates: Partial<StoredRelationType>): void {
    const types = this.getRelationTypes()
    const index = types.findIndex((t) => t.key === key)
    if (index !== -1) {
      types[index] = { ...types[index], ...updates }
      this.saveRelationTypes(types)
    }
  }

  deleteRelationType(key: RelationType): void {
    const types = this.getRelationTypes()
    const filtered = types.filter((t) => t.key !== key)
    this.saveRelationTypes(filtered)
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

  // 导出/导入数据
  exportData() {
    return {
      words: this.getWords(),
      connections: this.getConnections(),
      relationTypes: this.getRelationTypes(),
      exportedAt: new Date().toISOString(),
    }
  }

  importData(data: {
    words: StoredWord[]
    connections: StoredConnection[]
    relationTypes: StoredRelationType[]
  }): void {
    this.saveWords(data.words)
    this.saveConnections(data.connections)
    this.saveRelationTypes(data.relationTypes)
  }

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEYS.WORDS)
    localStorage.removeItem(STORAGE_KEYS.CONNECTIONS)
    localStorage.removeItem(STORAGE_KEYS.RELATION_TYPES)
  }
}

export const storageService = new StorageService()
