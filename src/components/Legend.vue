<template>
  <div class="absolute bottom-5 left-5 bg-white/60 backdrop-blur-md px-4 py-3 rounded-lg shadow-xl z-10 border border-white/50 max-h-[80vh] overflow-y-auto">
    <!-- 节点颜色说明 -->
    <div class="mb-4 pb-3 border-b border-gray-200">
      <h4 class="text-sm font-semibold mb-2 text-gray-800">节点颜色（关系数量）</h4>
      <div class="space-y-1">
        <div class="flex items-center text-xs">
          <span class="w-4 h-4 rounded-full mr-2" style="background-color: #95a5a6; border: 2px solid #7f8c8d;"></span>
          <span class="text-gray-600">0 个关系（孤立节点）</span>
        </div>
        <div class="flex items-center text-xs">
          <span class="w-4 h-4 rounded-full mr-2" style="background-color: #3498db; border: 2px solid #2980b9;"></span>
          <span class="text-gray-600">1-2 个关系</span>
        </div>
        <div class="flex items-center text-xs">
          <span class="w-4 h-4 rounded-full mr-2" style="background-color: #1abc9c; border: 2px solid #16a085;"></span>
          <span class="text-gray-600">3-5 个关系</span>
        </div>
        <div class="flex items-center text-xs">
          <span class="w-4 h-4 rounded-full mr-2" style="background-color: #f39c12; border: 2px solid #d68910;"></span>
          <span class="text-gray-600">6-10 个关系</span>
        </div>
        <div class="flex items-center text-xs">
          <span class="w-4 h-4 rounded-full mr-2" style="background-color: #e67e22; border: 2px solid #ca6f1e;"></span>
          <span class="text-gray-600">11-20 个关系</span>
        </div>
        <div class="flex items-center text-xs">
          <span class="w-4 h-4 rounded-full mr-2" style="background-color: #e74c3c; border: 2px solid #c0392b;"></span>
          <span class="text-gray-600">20+ 个关系（核心节点）</span>
        </div>
      </div>
    </div>

    <!-- 关系类型筛选 -->
    <div>
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGraphStore } from '@/stores/graphStore'
import { useAdminStore } from '@/stores/adminStore'

const graphStore = useGraphStore()
const adminStore = useAdminStore()

// 使用 computed 从 adminStore 获取关系类型，这样当数据更新时会自动响应
const relationTypes = computed(() => adminStore.relationTypes)
</script>
