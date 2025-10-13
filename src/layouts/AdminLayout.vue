<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <!-- 顶部导航 -->
    <header class="bg-white border-b border-gray-200 shadow-sm">
      <div class="px-6 py-4 flex items-center justify-between">
        <div class="flex items-center space-x-8">
          <h1 class="text-xl font-bold text-gray-900">📊 数据管理后台</h1>
          <nav class="flex space-x-1">
            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
              active-class="bg-primary-500 text-white"
              inactive-class="text-gray-700 hover:bg-gray-100"
            >
              {{ item.label }}
            </router-link>
          </nav>
        </div>
        <router-link
          to="/"
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          返回前台
        </router-link>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="flex-1 overflow-auto">
      <div class="max-w-7xl mx-auto px-6 py-8">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const navItems = [
  { path: '/admin/relations', label: '关系类型' },
  { path: '/admin/words', label: '词汇管理' },
  { path: '/admin/connections', label: '词汇关系' },
]
</script>
