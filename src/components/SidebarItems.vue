<script setup>
import { RouterLink } from 'vue-router'
import { adminResources } from '@/config/admin'

const menuItems = [
  { name: 'Dashboard', path: '/admin/dashboard' },
  ...adminResources.map((resource) => ({
    name: resource.label,
    path: `/admin/${resource.key}`,
  })),
]
</script>
<template>
  <RouterLink
    v-for="item in menuItems"
    :key="item.path"
    :to="item.path"
    class="rounded-lg px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-100"
  >
    {{ item.name }}
  </RouterLink>
</template>
