import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storageService } from '@/services/storageService'
import type { StoredWord, StoredConnection, StoredRelationType, StoredPosType } from '@/services/storageService'
import { clearRelationTypesCache } from '@/utils/relationUtils'

export const useAdminStore = defineStore('admin', () => {
  // State
  const words = ref<StoredWord[]>([])
  const connections = ref<StoredConnection[]>([])
  const relationTypes = ref<StoredRelationType[]>([])
  const posTypes = ref<StoredPosType[]>([])

  // Actions
  function loadData() {
    words.value = storageService.getWords()
    connections.value = storageService.getConnections()
    relationTypes.value = storageService.getRelationTypes()
    posTypes.value = storageService.getPosTypes()
  }

  // Words
  function addWord(word: Omit<StoredWord, 'createdAt' | 'updatedAt'>) {
    const newWord = storageService.addWord(word)
    words.value.push(newWord)
    return newWord
  }

  // 批量添加词汇 - 优化性能，减少 localStorage 写入次数
  function addWordsBatch(wordList: Array<Omit<StoredWord, 'createdAt' | 'updatedAt'>>) {
    const now = new Date().toISOString()
    const newWords: StoredWord[] = wordList.map(word => ({
      ...word,
      createdAt: now,
      updatedAt: now,
    }))

    // 一次性添加到内存
    words.value.push(...newWords)

    // 一次性写入 localStorage
    storageService.saveWords(words.value)

    return newWords
  }

  function updateWord(id: string, updates: Partial<StoredWord>) {
    storageService.updateWord(id, updates)
    const index = words.value.findIndex((w) => w.id === id)
    if (index !== -1) {
      words.value[index] = { ...words.value[index], ...updates }
    }
  }

  function deleteWord(id: string) {
    storageService.deleteWord(id)
    words.value = words.value.filter((w) => w.id !== id)
    connections.value = connections.value.filter((c) => c.source !== id && c.target !== id)
  }

  // Connections
  function addConnection(connection: Omit<StoredConnection, 'id' | 'createdAt'>) {
    const newConnection = storageService.addConnection(connection)
    connections.value.push(newConnection)
    return newConnection
  }

  function deleteConnection(id: string) {
    storageService.deleteConnection(id)
    connections.value = connections.value.filter((c) => c.id !== id)
  }

  // Relation Types
  function addRelationType(type: StoredRelationType) {
    const newType = storageService.addRelationType(type)
    relationTypes.value.push(newType)
    clearRelationTypesCache() // 清除缓存
    return newType
  }

  function updateRelationType(key: string, updates: Partial<StoredRelationType>) {
    storageService.updateRelationType(key, updates)
    const index = relationTypes.value.findIndex((t) => t.key === key)
    if (index !== -1) {
      relationTypes.value[index] = { ...relationTypes.value[index], ...updates }
    }
    clearRelationTypesCache() // 清除缓存
  }

  // 更新关系类型的键（同时迁移所有历史连接）
  function updateRelationTypeKey(oldKey: string, newKey: string, updates: Partial<StoredRelationType>) {
    // 1. 更新所有使用旧关系键的连接
    const affectedConnections = connections.value.filter(c => c.relation === oldKey)
    affectedConnections.forEach(conn => {
      storageService.updateConnection(conn.id, { relation: newKey })
      conn.relation = newKey
    })

    // 2. 更新其他关系类型的配对关系引用
    relationTypes.value.forEach(rt => {
      if (rt.pairWith === oldKey) {
        storageService.updateRelationType(rt.key, { pairWith: newKey })
        rt.pairWith = newKey
      }
    })

    // 3. 更新关系类型本身
    const fullUpdates = { ...updates, key: newKey }
    storageService.updateRelationType(oldKey, fullUpdates)
    const index = relationTypes.value.findIndex((t) => t.key === oldKey)
    if (index !== -1) {
      relationTypes.value[index] = { ...relationTypes.value[index], ...fullUpdates }
    }
    clearRelationTypesCache() // 清除缓存
  }

  function deleteRelationType(key: string) {
    storageService.deleteRelationType(key)
    relationTypes.value = relationTypes.value.filter((t) => t.key !== key)
    clearRelationTypesCache() // 清除缓存
  }

  // Update word relations (批量更新一个词汇的所有关系)
  function updateWordRelations(
    wordId: string,
    relations: Record<string, string[]>
  ) {
    // 从关系类型配置中动态构建关系映射
    const relationMapping: Record<string, string | null> = {}
    relationTypes.value.forEach(rt => {
      if (rt.pairWith) {
        relationMapping[rt.key] = rt.pairWith
      }
    })

    // 1. 删除该词汇的所有现有关系（只删除源为当前词的关系）
    const existingConnections = connections.value.filter((c) => c.source === wordId)

    // 记录旧的关系，用于删除反向关系 - 动态创建
    const oldRelations: Record<string, Set<string>> = {}
    Object.keys(relations).forEach(key => {
      oldRelations[key] = new Set()
    })

    existingConnections.forEach((conn) => {
      if (oldRelations[conn.relation]) {
        oldRelations[conn.relation].add(conn.target)
      }
      storageService.deleteConnection(conn.id)
    })

    // 2. 删除旧的反向关系
    Object.entries(oldRelations).forEach(([relationType, oldTargetIds]) => {
      const reverseRelation = relationMapping[relationType]
      if (reverseRelation) {
        oldTargetIds.forEach((oldTargetId) => {
          // 查找并删除反向关系
          const reverseConn = connections.value.find(
            (c) => c.source === oldTargetId && c.target === wordId && c.relation === reverseRelation
          )
          if (reverseConn) {
            storageService.deleteConnection(reverseConn.id)
          }
        })
      }
    })

    // 3. 更新本地状态 - 先移除所有旧的连接（包括源和目标）
    connections.value = connections.value.filter((c) => {
      // 移除源为当前词的连接
      if (c.source === wordId) return false
      // 移除目标为当前词且是反向关系的连接
      if (c.target === wordId) {
        // 检查是否是某个关系类型的反向关系
        for (const [relationType, _] of Object.entries(oldRelations)) {
          const reverseRelation = relationMapping[relationType]
          if (reverseRelation && c.relation === reverseRelation) {
            return false
          }
        }
      }
      return true
    })

    // 4. 添加新的关系
    const newConnections: StoredConnection[] = []
    Object.entries(relations).forEach(([relationType, targetIds]) => {
      targetIds.forEach((targetId) => {
        // 添加正向关系
        const newConn = storageService.addConnection({
          source: wordId,
          target: targetId,
          relation: relationType as any,
        })
        newConnections.push(newConn)

        // 添加反向关系
        const reverseRelation = relationMapping[relationType]
        if (reverseRelation) {
          const reverseConn = storageService.addConnection({
            source: targetId,
            target: wordId,
            relation: reverseRelation as any,
          })
          newConnections.push(reverseConn)
        }
      })
    })

    // 5. 添加新连接到本地状态
    connections.value.push(...newConnections)
  }

  // Import/Export
  function exportData() {
    return storageService.exportData()
  }

  function importData(data: any) {
    storageService.importData(data)
    loadData()
  }

  // Pos Types
  function addPosType(type: StoredPosType) {
    const newType = storageService.addPosType(type)
    posTypes.value.push(newType)
    return newType
  }

  function updatePosType(key: string, updates: Partial<StoredPosType>) {
    storageService.updatePosType(key, updates)
    const index = posTypes.value.findIndex((t) => t.key === key)
    if (index !== -1) {
      posTypes.value[index] = { ...posTypes.value[index], ...updates }
    }
  }

  function updatePosTypeKey(oldKey: string, newKey: string, updates: Partial<StoredPosType>) {
    storageService.updatePosTypeKey(oldKey, newKey, updates)
    const index = posTypes.value.findIndex((t) => t.key === oldKey)
    if (index !== -1) {
      posTypes.value[index] = { ...posTypes.value[index], ...updates, key: newKey }
    }
    // 重新加载词汇以反映词性变化
    words.value = storageService.getWords()
  }

  function deletePosType(key: string) {
    storageService.deletePosType(key)
    posTypes.value = posTypes.value.filter((t) => t.key !== key)
  }

  return {
    words,
    connections,
    relationTypes,
    posTypes,
    loadData,
    addWord,
    addWordsBatch,
    updateWord,
    deleteWord,
    addConnection,
    deleteConnection,
    addRelationType,
    updateRelationType,
    updateRelationTypeKey,
    deleteRelationType,
    updateWordRelations,
    addPosType,
    updatePosType,
    updatePosTypeKey,
    deletePosType,
    exportData,
    importData,
  }
})
