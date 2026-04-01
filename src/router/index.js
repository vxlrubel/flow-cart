import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/admin/dashboard',
    },
    {
      path: '/admin/dashboard',
      name: 'dashboard',
      component: () => import('../views/admin/AdminDashboardView.vue'),
    },
    {
      path: '/admin/:resourceKey',
      name: 'admin-resource-list',
      component: () => import('../views/admin/AdminResourceListView.vue'),
    },
    {
      path: '/admin/:resourceKey/new',
      name: 'admin-resource-create',
      component: () => import('../views/admin/AdminResourceFormView.vue'),
    },
    {
      path: '/admin/:resourceKey/:id/edit',
      name: 'admin-resource-edit',
      component: () => import('../views/admin/AdminResourceFormView.vue'),
    },
  ],
})

export default router
