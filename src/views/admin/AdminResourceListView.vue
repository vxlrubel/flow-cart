<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import { getResourceConfig, singularizeLabel } from '@/config/admin'
import { fetchCollection, patchRecord } from '@/services/api'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const errorMessage = ref('')
const records = ref([])
const relationOptions = ref({})
const showArchived = ref(false)
const searchTerm = ref('')

const resource = computed(() => getResourceConfig(route.params.resourceKey))

const relationMaps = computed(() =>
  Object.fromEntries(
    Object.entries(relationOptions.value).map(([resourceKey, options]) => [
      resourceKey,
      Object.fromEntries(options.map((option) => [option.id, option])),
    ]),
  ),
)

const filteredRows = computed(() => {
  const rows = records.value.filter((record) => showArchived.value || !record.deleted_at)
  const term = searchTerm.value.trim().toLowerCase()

  if (!term) {
    return rows
  }

  return rows.filter((record) =>
    resource.value.tableFields.some((fieldKey) => String(record[fieldKey] ?? '').toLowerCase().includes(term)),
  )
})

const activeCount = computed(() => records.value.filter((record) => !record.deleted_at).length)
const archivedCount = computed(() => records.value.filter((record) => record.deleted_at).length)

const ensureResource = () => {
  if (!resource.value) {
    router.replace('/admin/dashboard')
    return false
  }

  return true
}

const loadRelationOptions = async () => {
  const relationKeys = [...new Set(resource.value.fields.filter((field) => field.type === 'relation').map((field) => field.relation))]
  const entries = await Promise.all(
    relationKeys.map(async (resourceKey) => {
      const options = await fetchCollection(resourceKey)
      return [resourceKey, options.filter((record) => !record.deleted_at)]
    }),
  )
  relationOptions.value = Object.fromEntries(entries)
}

const loadRecords = async () => {
  if (!ensureResource()) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const [rows] = await Promise.all([fetchCollection(resource.value.key), loadRelationOptions()])
    records.value = rows.sort((left, right) => Number(right.id) - Number(left.id))
  } catch (error) {
    errorMessage.value = error.message || 'Failed to load records.'
  } finally {
    loading.value = false
  }
}

const archiveRecord = async (record) => {
  try {
    await patchRecord(resource.value.key, record.id, {
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    await loadRecords()
  } catch (error) {
    errorMessage.value = error.message || 'Failed to archive record.'
  }
}

const restoreRecord = async (record) => {
  try {
    await patchRecord(resource.value.key, record.id, {
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    await loadRecords()
  } catch (error) {
    errorMessage.value = error.message || 'Failed to restore record.'
  }
}

const editRecord = (record) => {
  router.push(`/admin/${resource.value.key}/${record.id}/edit`)
}

watch(
  () => route.params.resourceKey,
  async () => {
    await loadRecords()
  },
)

onMounted(loadRecords)
</script>

<template>
  <section v-if="resource" class="space-y-6">
    <div class="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Collection</p>
        <h1 class="mt-2 text-3xl font-semibold text-slate-900">{{ resource.label }}</h1>
        <p class="mt-2 max-w-2xl text-sm text-slate-500">{{ resource.description }}</p>
      </div>
      <RouterLink
        :to="`/admin/${resource.key}/new`"
        class="rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Create {{ singularizeLabel(resource.label) }}
      </RouterLink>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm text-slate-500">Active records</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{{ activeCount }}</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="text-sm text-slate-500">Archived records</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{{ archivedCount }}</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label class="text-sm font-semibold text-slate-600" for="resource-search">Search</label>
        <input
          id="resource-search"
          v-model="searchTerm"
          type="search"
          placeholder="Filter current table..."
          class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
      </div>
    </div>

    <div class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div class="text-sm text-slate-500">
        Showing {{ filteredRows.length }} of {{ records.length }} records
      </div>
      <label class="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
        <input v-model="showArchived" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-sky-600" />
        Include archived
      </label>
    </div>

    <div v-if="errorMessage" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ errorMessage }}
    </div>

    <AdminDataTable
      :resource="resource"
      :rows="filteredRows"
      :relation-maps="relationMaps"
      @edit="editRecord"
      @archive="archiveRecord"
      @restore="restoreRecord"
    />

    <div v-if="loading" class="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
      Loading {{ resource.label.toLowerCase() }}...
    </div>

    <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
      Soft delete is enabled. Archive sets <code>deleted_at</code> instead of removing the row.
    </div>
  </section>
</template>
