<template>
  <div class="absolute bottom-5 left-5 bg-white/60 backdrop-blur-md px-4 py-3 rounded-lg shadow-xl z-10 border border-white/50">
    <h4 class="text-sm font-semibold mb-2 text-gray-800">关系类型筛选</h4>
    <div class="space-y-1.5">
      <label
        v-for="relationType in relationTypes"
        :key="relationType.key"
        class="flex items-center text-sm cursor-pointer hover:bg-white/60 rounded px-2 py-1 transition-all"
      >
        <input
          type="checkbox"
          :checked="graphStore.activeRelations.includes(relationType.key)"
          class="mr-2 w-3.5 h-3.5 text-blue-500 rounded cursor-pointer"
          @change="graphStore.toggleRelation(relationType.key)"
        />
        <span
          class="w-5 h-0.5 mr-2 rounded transition-opacity"
          :style="{
            backgroundColor: relationType.color,
            opacity: graphStore.activeRelations.includes(relationType.key) ? 1 : 0.3
          }"
        />
        <span
          class="transition-opacity font-medium"
          :class="graphStore.activeRelations.includes(relationType.key) ? 'text-gray-700' : 'text-gray-400'"
        >
          {{ relationType.label }}
        </span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { storageService } from '@/services/storageService'
import type { StoredRelationType } from '@/services/storageService'

const graphStore = useGraphStore()
const relationTypes = ref<StoredRelationType[]>([])

onMounted(() => {
  relationTypes.value = storageService.getRelationTypes()
})
</script>
