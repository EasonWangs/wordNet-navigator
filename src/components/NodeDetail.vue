<template>
  <div
    v-if="graphStore.selectedNode"
    class="absolute top-5 right-5 w-80 max-h-[calc(100%-2.5rem)] bg-white/60 backdrop-blur-md shadow-2xl z-50 overflow-y-auto transition-all duration-300 rounded-lg border border-white/50"
    :class="{ 'translate-x-0 opacity-100': graphStore.selectedNode, 'translate-x-full opacity-0': !graphStore.selectedNode }"
  >
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-500/60 to-purple-500/60 backdrop-blur-sm text-white px-4 py-3 flex justify-between items-center sticky top-0 z-10">
      <h2 class="text-base font-bold">节点详情</h2>
      <div class="flex items-center gap-2">
        <!-- 编辑按钮 -->
        <button
          @click="handleEdit"
          class="p-1.5 bg-green-500/80 hover:bg-green-600/80 rounded-full transition-all"
          title="编辑词汇"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
        <!-- 停止朗读按钮 -->
        <button
          v-if="isSupported && isSpeaking"
          @click="stop"
          class="p-1.5 bg-red-500/80 hover:bg-red-600/80 rounded-full transition-all"
          title="停止朗读"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd"/>
          </svg>
        </button>
        <button
          class="w-7 h-7 bg-white/20 rounded-full text-xl leading-none hover:bg-white/30 transition-all hover:rotate-90 duration-200"
          @click="closePanel"
        >
          ×
        </button>
      </div>
    </div>

    <!-- Content -->
    <div v-if="graphStore.selectedNode" class="p-4">
      <!-- Word Title -->
      <div class="mb-4">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1">
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

          <!-- 朗读按钮 -->
          <button
            v-if="isSupported"
            @click="speakWord"
            :disabled="isSpeaking"
            class="flex-shrink-0 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            :title="isSpeaking ? '正在朗读...' : '朗读单词'"
          >
            <!-- 朗读图标 -->
            <svg v-if="!isSpeaking" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3.5a1 1 0 011 1v11a1 1 0 01-1.707.707l-3.5-3.5H3a1 1 0 010-2h2.793l3.5-3.5A1 1 0 0110 3.5z"/>
              <path d="M13.5 7a1 1 0 011.414 0 5 5 0 010 7.071 1 1 0 11-1.414-1.414 3 3 0 000-4.243A1 1 0 0113.5 7z"/>
            </svg>
            <!-- 播放中图标 -->
            <svg v-else class="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5 4a2 2 0 00-2 2v8a2 2 0 002 2h2V4H5zm4 0v12h2V4H9zm4 0v12h2a2 2 0 002-2V6a2 2 0 00-2-2h-2z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 词性-定义对 -->
      <div v-if="posDefinitionPairs.length > 0" class="mb-4">
        <h3 class="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">📖 词性与定义</h3>
        <div class="space-y-3">
          <div
            v-for="(pair, idx) in posDefinitionPairs"
            :key="idx"
            class="bg-gray-50/50 p-3 rounded-md relative group"
          >
            <!-- 词性标签 -->
            <div v-if="pair.pos" class="mb-2 flex items-center justify-between">
              <span class="inline-block px-2.5 py-1 bg-blue-100/80 text-blue-700 rounded-full text-xs font-semibold">
                {{ pair.pos }}
              </span>
              <!-- 朗读定义按钮 -->
              <button
                v-if="isSupported && pair.definition"
                @click="speakText(pair.definition)"
                class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-100 rounded"
                title="朗读定义"
              >
                <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3.5a1 1 0 011 1v11a1 1 0 01-1.707.707l-3.5-3.5H3a1 1 0 010-2h2.793l3.5-3.5A1 1 0 0110 3.5z"/>
                </svg>
              </button>
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
            class="text-gray-700 text-sm italic pl-3 py-2 border-l-3 border-blue-300/60 bg-gray-50/30 rounded-r relative group"
          >
            <div class="flex items-start justify-between gap-2">
              <span class="flex-1">"{{ example }}"</span>
              <!-- 朗读例句按钮 -->
              <button
                v-if="isSupported"
                @click="speakText(example)"
                class="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1 hover:bg-blue-100 rounded"
                title="朗读例句"
              >
                <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3.5a1 1 0 011 1v11a1 1 0 01-1.707.707l-3.5-3.5H3a1 1 0 010-2h2.793l3.5-3.5A1 1 0 0110 3.5z"/>
                </svg>
              </button>
            </div>
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
import { useTTS } from '@/composables/useTTS'

const graphStore = useGraphStore()
const adminStore = useAdminStore()

// TTS 功能
const { smartSpeak, stop, isSpeaking, isSupported } = useTTS()

// 定义事件发射器
const emit = defineEmits<{
  edit: [nodeData: any]
}>()

// 关闭面板时停止朗读
const closePanel = () => {
  stop()
  graphStore.setSelectedNode(null)
}

// 编辑按钮处理
const handleEdit = () => {
  if (!graphStore.selectedNode) return
  emit('edit', graphStore.selectedNode)
}

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

// TTS 朗读函数
const speakWord = () => {
  if (!graphStore.selectedNode) return
  const word = graphStore.selectedNode.label
  smartSpeak(word, { rate: 0.9 })
}

const speakText = (text: string) => {
  smartSpeak(text, { rate: 0.95 })
}
</script>
