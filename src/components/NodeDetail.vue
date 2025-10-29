<template>
  <div
    v-if="graphStore.selectedNode"
    class="absolute top-5 right-5 w-80 max-h-[calc(100%-2.5rem)] bg-white/60 backdrop-blur-md shadow-2xl z-50 overflow-y-auto transition-all duration-300 rounded-lg border border-white/50"
    :class="{ 'translate-x-0 opacity-100': graphStore.selectedNode, 'translate-x-full opacity-0': !graphStore.selectedNode }"
  >
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-500/60 to-purple-500/60 backdrop-blur-sm text-white px-4 py-3 flex justify-between items-center sticky top-0 z-10">
      <h2 class="text-base font-bold">节点详情</h2>
      <button
        class="w-7 h-7 bg-white/20 rounded-full text-xl leading-none hover:bg-white/30 transition-all hover:rotate-90 duration-200"
        @click="graphStore.setSelectedNode(null)"
      >
        ×
      </button>
    </div>

    <!-- Content -->
    <div v-if="graphStore.selectedNode" class="p-4">
      <!-- Word Title -->
      <div class="mb-4">
        <div class="text-2xl font-bold text-gray-800 mb-2">
          {{ graphStore.selectedNode.label }}
        </div>
        <!-- 节点ID（用于区分同名词汇） -->
        <div class="text-xs text-gray-400 mb-1 font-mono">
          ID: {{ graphStore.selectedNode.id }}
        </div>
        <!-- 音标 -->
        <div v-if="graphStore.selectedNode.phonetic" class="text-sm text-gray-600 mb-2 italic">
          {{ graphStore.selectedNode.phonetic }}
        </div>
      </div>

      <!-- 词性-定义对 -->
      <div v-if="posDefinitionPairs.length > 0" class="mb-4">
        <h3 class="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">📖 词性与定义</h3>
        <div class="space-y-3">
          <div
            v-for="(pair, idx) in posDefinitionPairs"
            :key="idx"
            class="bg-gray-50/50 p-3 rounded-md"
          >
            <!-- 词性标签 -->
            <div v-if="pair.pos" class="mb-2">
              <span class="inline-block px-2.5 py-1 bg-blue-100/80 text-blue-700 rounded-full text-xs font-semibold">
                {{ pair.pos }}
              </span>
            </div>
            <!-- 定义 -->
            <p v-if="pair.definition" class="text-gray-700 leading-relaxed text-sm">
              {{ pair.definition }}
            </p>
            <p v-else-if="!pair.pos" class="text-gray-500 text-sm italic">
              （无词性和定义）
            </p>
          </div>
        </div>
      </div>

      <!-- Examples -->
      <div v-if="graphStore.selectedNode.examples?.length" class="mb-4">
        <h3 class="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">💬 例句</h3>
        <ul class="space-y-2">
          <li
            v-for="(example, i) in graphStore.selectedNode.examples"
            :key="i"
            class="text-gray-700 text-sm italic pl-3 py-2 border-l-3 border-blue-300/60 bg-gray-50/30 rounded-r"
          >
            "{{ example }}"
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { useAdminStore } from '@/stores/adminStore'
import { migrateWordData } from '@/utils/wordDataUtils'

const graphStore = useGraphStore()
const adminStore = useAdminStore()

// 获取词性-定义对（自动迁移旧数据）
const posDefinitionPairs = computed(() => {
  if (!graphStore.selectedNode) return []

  // 迁移数据
  const migratedWord = migrateWordData(graphStore.selectedNode)

  if (!migratedWord.posDefinitions || migratedWord.posDefinitions.length === 0) {
    return []
  }

  // 格式化显示
  return migratedWord.posDefinitions
    .filter(pd => pd.pos || pd.definition) // 过滤完全空的对
    .map(pd => {
      let posLabel = undefined
      if (pd.pos) {
        const posType = adminStore.posTypes.find(pt => pt.key === pd.pos)
        if (posType) {
          posLabel = posType.abbreviation
            ? `${posType.label} (${posType.abbreviation})`
            : posType.label
        } else {
          posLabel = pd.pos
        }
      }

      return {
        pos: posLabel,
        definition: pd.definition,
      }
    })
})
</script>
