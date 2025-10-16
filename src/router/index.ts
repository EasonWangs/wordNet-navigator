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
    redirect: '/admin/words',
    meta: { title: '数据管理' },
    children: [
      {
        path: 'words',
        name: 'AdminWords',
        component: () => import('@/views/admin/Words.vue'),
        meta: { title: '词汇与关系管理' },
      },
      {
        path: 'relations',
        name: 'AdminRelations',
        component: () => import('@/views/admin/RelationTypes.vue'),
        meta: { title: '关系类型管理' },
      },
      {
        path: 'pos-types',
        name: 'AdminPosTypes',
        component: () => import('@/views/admin/PosTypes.vue'),
        meta: { title: '词性管理' },
      },
      {
        path: 'data',
        name: 'AdminData',
        component: () => import('@/views/admin/DataManagement.vue'),
        meta: { title: '数据管理' },
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
