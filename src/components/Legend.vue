<template>
  <div class="absolute bottom-5 left-5 bg-white px-4 py-4 rounded-lg shadow-lg z-10">
    <h4 class="text-sm font-semibold mb-3 text-gray-800">关系类型</h4>
    <div class="space-y-2">
      <div
        v-for="([key, config]) in Object.entries(relationConfig)"
        :key="key"
        class="flex items-center text-sm text-gray-700"
      >
        <span class="w-5 h-0.5 mr-2.5 rounded" :style="{ backgroundColor: config.color }" />
        {{ config.label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { relationConfig } from '@/utils/relationConfig'
</script>
