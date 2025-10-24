import type { WordNode, WordEdge, RelationType } from '@/types/wordnet'
import { relationConfig } from '@/utils/relationConfig'

const STORAGE_KEYS = {
  WORDS: 'wordnet_words',
  CONNECTIONS: 'wordnet_connections',
  RELATION_TYPES: 'wordnet_relation_types',
  POS_TYPES: 'wordnet_pos_types',
  PROJECTS: 'wordnet_projects',  // 项目列表
  CURRENT_PROJECT: 'wordnet_current_project',  // 当前激活的项目ID
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

export interface Project {
  id: string  // 项目唯一ID
  name: string  // 项目名称
  description?: string  // 项目描述
  createdAt: string  // 创建时间
  updatedAt: string  // 更新时间
  data: {
    words: StoredWord[]
    connections: StoredConnection[]
    relationTypes: StoredRelationType[]
    posTypes: StoredPosType[]
  }
}

class StorageService {
  // 关系类型管理
  getRelationTypes(): StoredRelationType[] {
    const stored = localStorage.getItem(STORAGE_KEYS.RELATION_TYPES)
    if (stored) {
      return JSON.parse(stored)
    }
    return []
  }

  // 初始化默认关系类型（仅在需要时调用）
  initializeDefaultRelationTypes(): StoredRelationType[] {
    const defaults: StoredRelationType[] = Object.entries(relationConfig).map(([key, config]) => {
      // 默认配对关系映射
      const defaultPairMap: Record<string, string> = {
        hypernym: 'hyponym',
        hyponym: 'hypernym',
        synonym: 'synonym',
        antonym: 'antonym',
        holonym: 'meronym',
        meronym: 'holonym',
        // compound 不需要配对关系
        graphonyms: 'graphonyms',
      }

      // 默认箭头样式映射
      const defaultArrowMap: Record<string, ArrowStyle> = {
        hypernym: 'filled',
        hyponym: 'filled',
        synonym: 'line',
        antonym: 'line',
        holonym: 'hollow',
        meronym: 'hollow',
        compound: 'filled',
        graphonyms: 'line',
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
    return []
  }

  // 初始化默认词性类型（仅在需要时调用）
  initializeDefaultPosTypes(): StoredPosType[] {
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
    localStorage.removeItem(STORAGE_KEYS.POS_TYPES)
  }

  // ========== 多项目管理 ==========

  // 获取所有项目
  getProjects(): Project[] {
    const stored = localStorage.getItem(STORAGE_KEYS.PROJECTS)
    return stored ? JSON.parse(stored) : []
  }

  // 保存项目列表
  private saveProjects(projects: Project[]): void {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))
  }

  // 获取当前激活的项目ID
  getCurrentProjectId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT)
  }

  // 设置当前激活的项目
  setCurrentProject(projectId: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, projectId)
  }

  // 创建新项目（从当前数据）
  createProjectFromCurrentData(name: string, description?: string): Project {
    const projects = this.getProjects()
    const now = new Date().toISOString()

    const newProject: Project = {
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      createdAt: now,
      updatedAt: now,
      data: {
        words: this.getWords(),
        connections: this.getConnections(),
        relationTypes: this.getRelationTypes(),
        posTypes: this.getPosTypes(),
      }
    }

    projects.push(newProject)
    this.saveProjects(projects)
    this.setCurrentProject(newProject.id)

    return newProject
  }

  // 导入数据为新项目
  importDataAsProject(name: string, data: {
    words: StoredWord[]
    connections: StoredConnection[]
    relationTypes: StoredRelationType[]
    posTypes?: StoredPosType[]
  }, description?: string): Project {
    const projects = this.getProjects()
    const now = new Date().toISOString()

    const newProject: Project = {
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      createdAt: now,
      updatedAt: now,
      data: {
        words: data.words,
        connections: data.connections,
        relationTypes: data.relationTypes,
        posTypes: data.posTypes || [],
      }
    }

    projects.push(newProject)
    this.saveProjects(projects)

    return newProject
  }

  // 切换到指定项目
  switchToProject(projectId: string): boolean {
    const projects = this.getProjects()
    const project = projects.find(p => p.id === projectId)

    if (!project) {
      return false
    }

    // 加载项目数据到当前工作区
    this.saveWords(project.data.words)
    this.saveConnections(project.data.connections)
    this.saveRelationTypes(project.data.relationTypes)
    this.savePosTypes(project.data.posTypes)

    this.setCurrentProject(projectId)
    return true
  }

  // 检查当前项目是否有未保存的修改
  hasUnsavedChanges(): boolean {
    const currentProjectId = this.getCurrentProjectId()
    if (!currentProjectId) {
      return false
    }

    const projects = this.getProjects()
    const project = projects.find(p => p.id === currentProjectId)

    if (!project) {
      return false
    }

    // 比较当前工作区数据和项目保存的数据
    const currentData = {
      words: this.getWords(),
      connections: this.getConnections(),
      relationTypes: this.getRelationTypes(),
      posTypes: this.getPosTypes(),
    }

    // 使用 JSON 字符串比较（简单但有效）
    return JSON.stringify(currentData) !== JSON.stringify(project.data)
  }

  // 更新当前项目数据
  updateCurrentProject(): boolean {
    const currentProjectId = this.getCurrentProjectId()
    if (!currentProjectId) {
      return false
    }

    const projects = this.getProjects()
    const index = projects.findIndex(p => p.id === currentProjectId)

    if (index === -1) {
      return false
    }

    projects[index].data = {
      words: this.getWords(),
      connections: this.getConnections(),
      relationTypes: this.getRelationTypes(),
      posTypes: this.getPosTypes(),
    }
    projects[index].updatedAt = new Date().toISOString()

    this.saveProjects(projects)
    return true
  }

  // 重命名项目
  renameProject(projectId: string, newName: string, newDescription?: string): boolean {
    const projects = this.getProjects()
    const index = projects.findIndex(p => p.id === projectId)

    if (index === -1) {
      return false
    }

    projects[index].name = newName
    if (newDescription !== undefined) {
      projects[index].description = newDescription
    }
    projects[index].updatedAt = new Date().toISOString()

    this.saveProjects(projects)
    return true
  }

  // 删除项目
  deleteProject(projectId: string): boolean {
    const projects = this.getProjects()
    const filtered = projects.filter(p => p.id !== projectId)

    if (filtered.length === projects.length) {
      return false  // 项目不存在
    }

    this.saveProjects(filtered)

    // 如果删除的是当前项目，清空当前项目ID
    if (this.getCurrentProjectId() === projectId) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT)
      // 清空当前工作区数据
      this.clearAll()
    }

    return true
  }

  // 导出项目
  exportProject(projectId: string): Project | null {
    const projects = this.getProjects()
    const project = projects.find(p => p.id === projectId)
    return project || null
  }
}


export const storageService = new StorageService()
