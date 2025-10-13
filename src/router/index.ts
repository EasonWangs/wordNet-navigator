import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Viewer',
    component: () => import('@/views/Viewer.vue'),
    meta: { title: 'WordNet 可视化' },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/admin/relations',
    meta: { title: '数据管理' },
    children: [
      {
        path: 'relations',
        name: 'AdminRelations',
        component: () => import('@/views/admin/RelationTypes.vue'),
        meta: { title: '关系类型管理' },
      },
      {
        path: 'words',
        name: 'AdminWords',
        component: () => import('@/views/admin/Words.vue'),
        meta: { title: '词汇管理' },
      },
      {
        path: 'connections',
        name: 'AdminConnections',
        component: () => import('@/views/admin/Connections.vue'),
        meta: { title: '词汇关系管理' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 设置页面标题
router.afterEach((to) => {
  document.title = (to.meta.title as string) || 'WordNet Navigator'
})

export default router
