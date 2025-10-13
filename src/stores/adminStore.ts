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
    exportData,
    importData,
  }
})
