<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AdminStatCard from '@/components/admin/AdminStatCard.vue'
import { adminResources } from '@/config/admin'
import { fetchCollection } from '@/services/api'

const loading = ref(true)
const errorMessage = ref('')
const collectionStats = ref([])

const totalActiveRecords = computed(() =>
  collectionStats.value.reduce((total, item) => total + item.activeCount, 0),
)

const totalArchivedRecords = computed(() =>
  collectionStats.value.reduce((total, item) => total + item.archivedCount, 0),
)

const loadDashboard = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const stats = await Promise.all(
      adminResources.map(async (resource) => {
        const records = await fetchCollection(resource.key)
        const activeCount = records.filter((record) => !record.deleted_at).length
        const archivedCount = records.length - activeCount

        return {
          ...resource,
          activeCount,
          archivedCount,
          latestUpdatedAt: records
            .map((record) => record.updated_at)
            .filter(Boolean)
            .sort()
            .at(-1),
        }
      }),
    )

    collectionStats.value = stats
  } catch (error) {
    errorMessage.value = error.message || 'Failed to load dashboard data.'
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>

<template>
  <section class="space-y-6">
    <div class="rounded-3xl bg-linear-to-r from-sky-600 via-cyan-600 to-teal-600 p-6 text-white shadow-lg">
      <p class="text-sm font-semibold uppercase tracking-[0.24em] text-sky-100">Admin Dashboard</p>
      <h1 class="mt-3 text-3xl font-semibold">Flow Cart control center</h1>
      <p class="mt-3 max-w-3xl text-sm text-sky-50">
        Every collection from <code>db.json</code> is available here with create, edit, and soft-delete flows.
      </p>
    </div>

    <div v-if="errorMessage" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ errorMessage }}
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <AdminStatCard label="Collections" :value="collectionStats.length" detail="Managed resource groups" />
      <AdminStatCard label="Active Records" :value="totalActiveRecords" detail="Visible rows across collections" />
      <AdminStatCard label="Archived Records" :value="totalArchivedRecords" detail="Soft-deleted rows" />
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="resource in collectionStats"
        :key="resource.key"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold text-slate-900">{{ resource.label }}</h2>
            <p class="mt-2 text-sm text-slate-500">{{ resource.description }}</p>
          </div>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
            {{ resource.activeCount }} active
          </span>
        </div>
        <dl class="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-xl bg-slate-50 p-3">
            <dt class="text-slate-500">Active</dt>
            <dd class="mt-1 text-lg font-semibold text-slate-900">{{ resource.activeCount }}</dd>
          </div>
          <div class="rounded-xl bg-slate-50 p-3">
            <dt class="text-slate-500">Archived</dt>
            <dd class="mt-1 text-lg font-semibold text-slate-900">{{ resource.archivedCount }}</dd>
          </div>
        </dl>
        <p class="mt-4 text-xs text-slate-400">
          Last update:
          {{ resource.latestUpdatedAt ? new Date(resource.latestUpdatedAt).toLocaleString() : 'N/A' }}
        </p>
        <div class="mt-5 flex gap-3">
          <RouterLink
            :to="`/admin/${resource.key}`"
            class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Open
          </RouterLink>
          <RouterLink
            :to="`/admin/${resource.key}/new`"
            class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Create
          </RouterLink>
        </div>
      </article>
    </div>

    <div v-if="loading" class="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
      Loading dashboard metrics...
    </div>
  </section>
</template>
