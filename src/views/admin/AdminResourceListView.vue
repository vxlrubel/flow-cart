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
const selectedIds = ref([])
const currentPage = ref(1)
const perPage = ref(10)
const productCategoryFilter = ref('')
const productDateFilter = ref('')
const productSort = ref('')
const syncingFromRoute = ref(false)

const defaultPerPage = 10
const perPageOptions = [10, 20, 50, 100]
const productDateOptions = [
  { value: '', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
]
const productSortOptions = [
  { value: '', label: 'Latest' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'price_desc', label: 'Price (High-Low)' },
  { value: 'price_asc', label: 'Price (Low-High)' },
]

const resource = computed(() => getResourceConfig(route.params.resourceKey))
const isProductListing = computed(() => resource.value?.key === 'products')
const categoryOptions = computed(() => relationOptions.value.categories || [])

const relationMaps = computed(() =>
  Object.fromEntries(
    Object.entries(relationOptions.value).map(([resourceKey, options]) => [
      resourceKey,
      Object.fromEntries(options.map((option) => [option.id, option])),
    ]),
  ),
)

const productFilteredRows = (rows) => {
  if (!isProductListing.value) {
    return rows
  }

  let nextRows = [...rows]

  if (productCategoryFilter.value) {
    nextRows = nextRows.filter(
      (record) => String(record.category_id) === productCategoryFilter.value,
    )
  }

  if (productDateFilter.value) {
    const now = new Date()
    nextRows = nextRows.filter((record) => {
      if (!record.created_at) {
        return false
      }

      const createdAt = new Date(record.created_at)

      if (productDateFilter.value === 'today') {
        return createdAt.toDateString() === now.toDateString()
      }

      const diffInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)

      if (productDateFilter.value === 'last7') {
        return diffInDays <= 7
      }

      if (productDateFilter.value === 'last30') {
        return diffInDays <= 30
      }

      return true
    })
  }

  if (productSort.value === 'name_asc') {
    nextRows.sort((left, right) => String(left.name ?? '').localeCompare(String(right.name ?? '')))
  } else if (productSort.value === 'name_desc') {
    nextRows.sort((left, right) => String(right.name ?? '').localeCompare(String(left.name ?? '')))
  } else if (productSort.value === 'price_desc') {
    nextRows.sort((left, right) => Number(right.price ?? 0) - Number(left.price ?? 0))
  } else if (productSort.value === 'price_asc') {
    nextRows.sort((left, right) => Number(left.price ?? 0) - Number(right.price ?? 0))
  }

  return nextRows
}

const filteredRows = computed(() => {
  const rows = records.value.filter((record) => showArchived.value || !record.deleted_at)
  const term = searchTerm.value.trim().toLowerCase()
  const searchedRows = !term
    ? rows
    : rows.filter((record) =>
        resource.value.tableFields.some((fieldKey) =>
          String(record[fieldKey] ?? '')
            .toLowerCase()
            .includes(term),
        ),
      )

  return productFilteredRows(searchedRows)
})

const activeCount = computed(() => records.value.filter((record) => !record.deleted_at).length)
const archivedCount = computed(() => records.value.filter((record) => record.deleted_at).length)
const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / perPage.value)))
const paginatedRows = computed(() => {
  const startIndex = (currentPage.value - 1) * perPage.value
  return filteredRows.value.slice(startIndex, startIndex + perPage.value)
})
const allVisibleSelected = computed(
  () =>
    paginatedRows.value.length > 0 &&
    paginatedRows.value.every((row) => selectedIds.value.includes(row.id)),
)
const selectedCount = computed(() => selectedIds.value.length)
const hasActiveSelection = computed(() =>
  records.value.some((record) => selectedIds.value.includes(record.id) && !record.deleted_at),
)
const hasArchivedSelection = computed(() =>
  records.value.some((record) => selectedIds.value.includes(record.id) && record.deleted_at),
)
const paginationBasePath = computed(() => `/admin/${resource.value.key}`)
const paginationRangeStart = computed(() =>
  filteredRows.value.length === 0 ? 0 : (currentPage.value - 1) * perPage.value + 1,
)
const paginationRangeEnd = computed(() =>
  Math.min(currentPage.value * perPage.value, filteredRows.value.length),
)

const normalizePage = (page) => {
  const parsed = Number.parseInt(String(page ?? '1'), 10)
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed
}

const normalizePerPage = (value) => {
  const parsed = Number.parseInt(String(value ?? defaultPerPage), 10)
  return perPageOptions.includes(parsed) ? parsed : defaultPerPage
}

const applyQueryState = () => {
  syncingFromRoute.value = true
  searchTerm.value = typeof route.query.q === 'string' ? route.query.q : ''
  showArchived.value = route.query.archived === '1'
  currentPage.value = normalizePage(route.query.page)
  perPage.value = normalizePerPage(route.query.perPage)
  productCategoryFilter.value =
    isProductListing.value && typeof route.query.category === 'string' ? route.query.category : ''
  productDateFilter.value =
    isProductListing.value && typeof route.query.date === 'string' ? route.query.date : ''
  productSort.value =
    isProductListing.value && typeof route.query.sort === 'string' ? route.query.sort : ''
  syncingFromRoute.value = false
}

const buildQuery = () => {
  const query = {}

  if (searchTerm.value.trim()) {
    query.q = searchTerm.value.trim()
  }

  if (showArchived.value) {
    query.archived = '1'
  }

  if (currentPage.value > 1) {
    query.page = String(currentPage.value)
  }

  if (perPage.value !== defaultPerPage) {
    query.perPage = String(perPage.value)
  }

  if (isProductListing.value) {
    if (productCategoryFilter.value) {
      query.category = productCategoryFilter.value
    }

    if (productDateFilter.value) {
      query.date = productDateFilter.value
    }

    if (productSort.value) {
      query.sort = productSort.value
    }
  }

  return query
}

const syncQuery = () => {
  if (syncingFromRoute.value || !resource.value) {
    return
  }

  router.replace({
    path: paginationBasePath.value,
    query: buildQuery(),
  })
}

const clampCurrentPage = () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
}

const clearHiddenSelections = () => {
  const availableIds = new Set(filteredRows.value.map((row) => row.id))
  selectedIds.value = selectedIds.value.filter((id) => availableIds.has(id))
}

const ensureResource = () => {
  if (!resource.value) {
    router.replace('/admin/dashboard')
    return false
  }

  return true
}

const loadRelationOptions = async () => {
  const relationKeys = [
    ...new Set(
      resource.value.fields
        .filter((field) => field.type === 'relation')
        .map((field) => field.relation),
    ),
  ]
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
    clearHiddenSelections()
    clampCurrentPage()
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

const toggleRowSelection = ({ id, checked }) => {
  selectedIds.value = checked
    ? [...new Set([...selectedIds.value, id])]
    : selectedIds.value.filter((selectedId) => selectedId !== id)
}

const toggleAllVisible = (checked) => {
  const visibleIds = paginatedRows.value.map((row) => row.id)

  if (checked) {
    selectedIds.value = [...new Set([...selectedIds.value, ...visibleIds])]
    return
  }

  selectedIds.value = selectedIds.value.filter((id) => !visibleIds.includes(id))
}

const bulkUpdateDeletedAt = async (deletedAtValue) => {
  const targetRecords = records.value.filter((record) => {
    if (!selectedIds.value.includes(record.id)) {
      return false
    }

    return deletedAtValue === null ? Boolean(record.deleted_at) : !record.deleted_at
  })

  if (targetRecords.length === 0) {
    return
  }

  try {
    await Promise.all(
      targetRecords.map((record) =>
        patchRecord(resource.value.key, record.id, {
          deleted_at: deletedAtValue,
          updated_at: new Date().toISOString(),
        }),
      ),
    )

    selectedIds.value = []
    await loadRecords()
  } catch (error) {
    errorMessage.value = error.message || 'Failed to update selected records.'
  }
}

const bulkArchive = async () => {
  await bulkUpdateDeletedAt(new Date().toISOString())
}

const bulkRestore = async () => {
  await bulkUpdateDeletedAt(null)
}

const goToPage = (page) => {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value)
}

watch(
  () => route.params.resourceKey,
  async () => {
    selectedIds.value = []
    applyQueryState()
    await loadRecords()
  },
)

watch(
  () => route.query,
  () => {
    applyQueryState()
  },
)

watch(filteredRows, () => {
  clearHiddenSelections()
  clampCurrentPage()
})

watch([searchTerm, showArchived, productCategoryFilter, productDateFilter, productSort], () => {
  if (syncingFromRoute.value) {
    return
  }

  currentPage.value = 1
  clearHiddenSelections()
  syncQuery()
})

watch([currentPage, perPage], () => {
  if (syncingFromRoute.value) {
    return
  }

  clearHiddenSelections()
  syncQuery()
})

onMounted(async () => {
  applyQueryState()
  await loadRecords()
})
</script>

<template>
  <section v-if="resource" class="space-y-6">
    <div
      class="flex flex-col gap-4 rounded shadow-sm lg:flex-row lg:items-end lg:justify-between bg-linear-to-r from-sky-600 via-cyan-600 to-teal-600 p-6 text-white"
    >
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.24em] text-sky-100">Collection</p>
        <h1 class="mt-3 text-2xl capitalize font-semibold">{{ resource.label }}</h1>
        <p class="mt-3 max-w-3xl text-sm text-sky-50">{{ resource.description }}</p>
      </div>
      <RouterLink
        :to="`/admin/${resource.key}/new`"
        class="rounded h-8 text-slate-900 px-4 inline-flex items-center justify-center text-sm font-semibold bg-white transition hover:bg-gray-100"
      >
        Create {{ singularizeLabel(resource.label) }}
      </RouterLink>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="border border-slate-200 shadow-sm bg-white p-5 rounded">
        <p class="text-sm text-slate-500">Active records</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{{ activeCount }}</p>
      </div>
      <div class="border border-slate-200 shadow-sm bg-white p-5 rounded">
        <p class="text-sm text-slate-500">Archived records</p>
        <p class="mt-2 text-2xl font-semibold text-slate-900">{{ archivedCount }}</p>
      </div>
      <div class="border border-slate-200 shadow-sm bg-white p-5 rounded">
        <label class="text-sm font-semibold text-slate-600" for="resource-search">Search</label>
        <input
          id="resource-search"
          v-model="searchTerm"
          type="search"
          placeholder="Filter current table..."
          class="mt-2 w-full rounded border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
      </div>
    </div>

    <div v-if="isProductListing" class="grid gap-4 md:grid-cols-3">
      <div class="rounded border border-slate-200 bg-white py-3 px-5 shadow-sm">
        <label class="text-sm font-semibold text-slate-600" for="product-category-filter"
          >Category</label
        >
        <select
          id="product-category-filter"
          v-model="productCategoryFilter"
          class="mt-2 w-full rounded border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        >
          <option value="">All categories</option>
          <option
            v-for="category in categoryOptions"
            :key="category.id"
            :value="String(category.id)"
          >
            {{ category.name }}
          </option>
        </select>
      </div>
      <div class="rounded border border-slate-200 bg-white py-3 px-5 shadow-sm">
        <label class="text-sm font-semibold text-slate-600" for="product-date-filter"
          >Date filter</label
        >
        <select
          id="product-date-filter"
          v-model="productDateFilter"
          class="mt-2 w-full rounded border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        >
          <option
            v-for="option in productDateOptions"
            :key="option.value || 'all'"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>
      <div class="rounded border border-slate-200 bg-white py-3 px-5 shadow-sm">
        <label class="text-sm font-semibold text-slate-600" for="product-sort">Sort by</label>
        <select
          id="product-sort"
          v-model="productSort"
          class="mt-2 w-full rounded border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        >
          <option
            v-for="option in productSortOptions"
            :key="option.value || 'latest'"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>

    <div
      class="flex items-center justify-between rounded border border-slate-200 bg-white px-5 py-3 shadow-sm"
    >
      <div class="text-sm text-slate-500">
        Showing {{ paginationRangeStart }}-{{ paginationRangeEnd }} of
        {{ filteredRows.length }} filtered records
      </div>
      <div class="flex flex-wrap items-center gap-4">
        <label class="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
          <input
            v-model="showArchived"
            type="checkbox"
            class="h-4 w-4 rounded border-slate-300 text-sky-600"
          />
          Include archived
        </label>
        <label class="flex items-center gap-3 text-sm font-medium text-slate-700">
          Per page
          <select
            v-model="perPage"
            class="rounded border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            <option v-for="option in perPageOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </label>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      {{ errorMessage }}
    </div>

    <div
      class="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-200 bg-white px-5 py-3 shadow-sm"
    >
      <div class="text-sm text-slate-500">{{ selectedCount }} selected</div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!hasActiveSelection"
          @click="bulkArchive"
        >
          Archive selected
        </button>
        <button
          type="button"
          class="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!hasArchivedSelection"
          @click="bulkRestore"
        >
          Restore selected
        </button>
      </div>
    </div>

    <AdminDataTable
      :resource="resource"
      :rows="paginatedRows"
      :relation-maps="relationMaps"
      :selected-ids="selectedIds"
      :all-visible-selected="allVisibleSelected"
      @edit="editRecord"
      @archive="archiveRecord"
      @restore="restoreRecord"
      @toggle-row="toggleRowSelection"
      @toggle-all="toggleAllVisible"
    />

    <div
      class="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-200 bg-white px-5 py-3 shadow-sm"
    >
      <div class="text-sm text-slate-500">Page {{ currentPage }} of {{ totalPages }}</div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          Prev
        </button>
        <button
          v-for="page in totalPages"
          :key="page"
          type="button"
          class="rounded px-3 py-2 text-sm font-medium transition cursor-pointer"
          :class="
            page === currentPage
              ? 'bg-slate-900 text-white'
              : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
          "
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button
          type="button"
          class="rounded-lg border cursor-pointer border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <div
      v-if="loading"
      class="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500"
    >
      Loading {{ resource.label.toLowerCase() }}...
    </div>

    <div class="rounded border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-500">
      Soft delete is enabled. Archive sets <code>deleted_at</code> instead of removing the row.
    </div>
  </section>
</template>
