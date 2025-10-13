import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storageService } from '@/services/storageService'
import type { StoredWord, StoredConnection, StoredRelationType } from '@/services/storageService'

export const useAdminStore = defineStore('admin', () => {
  // State
  const words = ref<StoredWord[]>([])
  const connections = ref<StoredConnection[]>([])
  const relationTypes = ref<StoredRelationType[]>([])

  // Actions
  function loadData() {
    words.value = storageService.getWords()
    connections.value = storageService.getConnections()
    relationTypes.value = storageService.getRelationTypes()
  }

  // Words
  function addWord(word: Omit<StoredWord, 'createdAt' | 'updatedAt'>) {
    const newWord = storageService.addWord(word)
    words.value.push(newWord)
    return newWord
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
  function addRelationType(type: Omit<StoredRelationType, 'key'>) {
    const newType = storageService.addRelationType(type)
    relationTypes.value.push(newType)
    return newType
  }

  function updateRelationType(key: string, updates: Partial<StoredRelationType>) {
    storageService.updateRelationType(key as any, updates)
    const index = relationTypes.value.findIndex((t) => t.key === key)
    if (index !== -1) {
      relationTypes.value[index] = { ...relationTypes.value[index], ...updates }
    }
  }

  function deleteRelationType(key: string) {
    storageService.deleteRelationType(key as any)
    relationTypes.value = relationTypes.value.filter((t) => t.key !== key)
  }

  // Update word relations (批量更新一个词汇的所有关系)
  function updateWordRelations(
    wordId: string,
    relations: {
      hypernym: string[]
      hyponym: string[]
      synonym: string[]
      antonym: string[]
      holonym: string[]
      meronym: string[]
    }
  ) {
    // 定义关系映射：添加某种关系时，需要在目标词汇添加的反向关系
    const relationMapping: Record<string, string | null> = {
      hypernym: 'hyponym',    // 上位词 -> 下位词
      hyponym: 'hypernym',    // 下位词 -> 上位词
      synonym: 'synonym',     // 同义词 -> 同义词
      antonym: 'antonym',     // 反义词 -> 反义词
      holonym: 'meronym',     // 整体词 -> 部分词
      meronym: 'holonym',     // 部分词 -> 整体词
    }

    // 1. 删除该词汇的所有现有关系（只删除源为当前词的关系）
    const existingConnections = connections.value.filter((c) => c.source === wordId)

    // 记录旧的关系，用于删除反向关系
    const oldRelations: Record<string, Set<string>> = {
      hypernym: new Set(),
      hyponym: new Set(),
      synonym: new Set(),
      antonym: new Set(),
      holonym: new Set(),
      meronym: new Set(),
    }

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
            connections.value = connections.value.filter((c) => c.id !== reverseConn.id)
          }
        })
      }
    })

    // 3. 添加新的关系
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
          // 检查反向关系是否已存在，避免重复
          const existingReverse = connections.value.find(
            (c) => c.source === targetId && c.target === wordId && c.relation === reverseRelation
          )

          if (!existingReverse) {
            const reverseConn = storageService.addConnection({
              source: targetId,
              target: wordId,
              relation: reverseRelation as any,
            })
            newConnections.push(reverseConn)
          }
        }
      })
    })

    // 4. 更新本地状态
    connections.value = connections.value.filter((c) => c.source !== wordId)
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

  return {
    words,
    connections,
    relationTypes,
    loadData,
    addWord,
    updateWord,
    deleteWord,
    addConnection,
    deleteConnection,
    addRelationType,
    updateRelationType,
    deleteRelationType,
    updateWordRelations,
    exportData,
    importData,
  }
})
