<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ResourceForm from '@/components/admin/ResourceForm.vue'
import {
  buildEmptyRecord,
  formatPrimaryValue,
  getResourceConfig,
  preparePayload,
  singularizeLabel,
} from '@/config/admin'
import {
  createRecord,
  fetchCollection,
  fetchRecord,
  fetchRelationOptions,
  updateRecord,
} from '@/services/api'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const submitting = ref(false)
const errorMessage = ref('')
const formState = ref({})
const existingRecord = ref(null)
const relationOptions = ref({})

const resource = computed(() => getResourceConfig(route.params.resourceKey))
const isEditMode = computed(() => Boolean(route.params.id))

const pageTitle = computed(() => {
  if (!resource.value) {
    return 'Admin record'
  }

  if (!isEditMode.value) {
    return `Create ${singularizeLabel(resource.value.label)}`
  }

  return `Edit ${formatPrimaryValue(resource.value, existingRecord.value)}`
})

const getRelationKeys = () => [
  ...new Set(
    resource.value.fields
      .filter((field) => field.type === 'relation')
      .map((field) => field.relation),
  ),
]

const loadRelationOptions = async (baseRows = null) => {
  const relationKeys = getRelationKeys()
  const ownResourceKey = resource.value.key
  const externalRelationKeys = relationKeys.filter((relationKey) => relationKey !== ownResourceKey)
  const nextRelationOptions = {}

  if (relationKeys.includes(ownResourceKey) && Array.isArray(baseRows)) {
    nextRelationOptions[ownResourceKey] = baseRows.filter((record) => !record.deleted_at)
  }

  if (externalRelationKeys.length > 0) {
    Object.assign(nextRelationOptions, await fetchRelationOptions(externalRelationKeys))
  }

  relationOptions.value = nextRelationOptions
}

const applyFormState = (record = null) => {
  existingRecord.value = record
  formState.value = buildEmptyRecord(resource.value)

  if (!record) {
    return
  }

  resource.value.fields.forEach((field) => {
    formState.value[field.key] = record[field.key] ?? ''
  })
}

const loadPage = async () => {
  if (!resource.value) {
    router.replace('/admin/dashboard')
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const relationKeys = getRelationKeys()
    const needsOwnCollection = relationKeys.includes(resource.value.key)

    if (isEditMode.value) {
      const requests = [fetchRecord(resource.value.key, route.params.id)]

      if (needsOwnCollection) {
        requests.push(fetchCollection(resource.value.key))
      }

      const [record, ownCollection = null] = await Promise.all(requests)
      await loadRelationOptions(ownCollection)
      applyFormState(record)
    } else {
      let ownCollection = null

      if (needsOwnCollection) {
        ownCollection = await fetchCollection(resource.value.key)
      }

      await loadRelationOptions(ownCollection)
      applyFormState()
    }
  } catch (error) {
    errorMessage.value = error.message || 'Failed to load record.'
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  submitting.value = true
  errorMessage.value = ''

  try {
    const payload = preparePayload(resource.value, formState.value, existingRecord.value)

    if (isEditMode.value) {
      await updateRecord(resource.value.key, route.params.id, payload)
    } else {
      await createRecord(resource.value.key, payload)
    }

    router.push(`/admin/${resource.value.key}`)
  } catch (error) {
    errorMessage.value = error.message || 'Failed to save record.'
  } finally {
    submitting.value = false
  }
}

onMounted(loadPage)

watch(
  () => route.fullPath,
  async () => {
    await loadPage()
  },
)
</script>

<template>
  <section v-if="resource" class="space-y-6">
    <div
      class="flex flex-col gap-4 rounded shadow-sm lg:flex-row lg:items-end lg:justify-between bg-linear-to-r from-sky-600 via-cyan-600 to-teal-600 p-6 text-white"
    >
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.24em] text-sky-100">
          {{ isEditMode ? 'Edit Record' : 'Create Record' }}
        </p>
        <h1 class="mt-3 text-2xl capitalize font-semibold">{{ pageTitle }}</h1>
        <p class="mt-3 max-w-3xl text-sm text-sky-50">
          {{ resource.description }}
        </p>
      </div>
      <RouterLink
        :to="`/admin/${resource.key}`"
        class="rounded h-8 text-slate-900 px-4 inline-flex items-center justify-center text-sm font-semibold bg-white transition hover:bg-gray-100"
      >
        Back to {{ resource.label }}
      </RouterLink>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      {{ errorMessage }}
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div v-if="loading" class="text-sm text-slate-500">Loading form...</div>
      <ResourceForm
        v-else
        v-model="formState"
        :resource="resource"
        :relation-options="relationOptions"
        :submitting="submitting"
        @submit="submitForm"
      />
    </div>
  </section>
</template>
