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
import { createRecord, fetchCollection, fetchRecord, updateRecord } from '@/services/api'

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

const loadPage = async () => {
  if (!resource.value) {
    router.replace('/admin/dashboard')
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    await loadRelationOptions()

    if (isEditMode.value) {
      const record = await fetchRecord(resource.value.key, route.params.id)
      existingRecord.value = record
      formState.value = buildEmptyRecord(resource.value)

      resource.value.fields.forEach((field) => {
        formState.value[field.key] = record[field.key] ?? ''
      })
    } else {
      existingRecord.value = null
      formState.value = buildEmptyRecord(resource.value)
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
    <div class="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">
          {{ isEditMode ? 'Edit Record' : 'Create Record' }}
        </p>
        <h1 class="mt-2 text-3xl font-semibold text-slate-900">{{ pageTitle }}</h1>
        <p class="mt-2 max-w-2xl text-sm text-slate-500">
          {{ resource.description }}
        </p>
      </div>
      <RouterLink
        :to="`/admin/${resource.key}`"
        class="rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        Back to {{ resource.label }}
      </RouterLink>
    </div>

    <div v-if="errorMessage" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
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
