<script setup>
const props = defineProps({
  resource: {
    type: Object,
    required: true,
  },
  rows: {
    type: Array,
    required: true,
  },
  relationMaps: {
    type: Object,
    required: true,
  },
  selectedIds: {
    type: Array,
    required: true,
  },
  allVisibleSelected: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['edit', 'archive', 'restore', 'toggle-row', 'toggle-all'])

const getFieldConfig = (fieldKey) => props.resource.fields.find((field) => field.key === fieldKey)

const isSelected = (rowId) => props.selectedIds.includes(rowId)

const formatCell = (fieldKey, row) => {
  if (fieldKey === 'updated_at' || fieldKey === 'created_at' || fieldKey === 'deleted_at') {
    return row[fieldKey] ? new Date(row[fieldKey]).toLocaleString() : 'N/A'
  }

  if (fieldKey === 'id') {
    return `#${row.id}`
  }

  const field = getFieldConfig(fieldKey)

  if (field?.type === 'relation') {
    const relationMap = props.relationMaps[field.relation] || {}
    const related = relationMap[row[fieldKey]]
    return related?.[field.optionLabel] ?? `#${row[fieldKey] ?? 'N/A'}`
  }

  return row[fieldKey] ?? 'N/A'
}
</script>

<template>
  <div class="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-3 pt-2 text-left w-[40px]">
              <input
                type="checkbox"
                :checked="allVisibleSelected"
                class="h-4 w-4 rounded border-slate-300 text-sky-600"
                @change="emit('toggle-all', $event.target.checked)"
              />
            </th>
            <th
              v-for="fieldKey in resource.tableFields"
              :key="fieldKey"
              class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
            >
              {{ fieldKey.replaceAll('_', ' ') }}
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr v-for="row in rows" :key="row.id" class="align-top">
            <td class="px-3 pt-4 text-left w-[40px]">
              <input
                type="checkbox"
                :checked="isSelected(row.id)"
                class="h-4 w-4 rounded border-slate-300 text-sky-600"
                @change="emit('toggle-row', { id: row.id, checked: $event.target.checked })"
              />
            </td>
            <td
              v-for="fieldKey in resource.tableFields"
              :key="`${row.id}-${fieldKey}`"
              class="whitespace-nowrap px-4 py-4 text-sm text-slate-700"
            >
              {{ formatCell(fieldKey, row) }}
            </td>
            <td class="px-4 py-4 text-right text-sm">
              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  class="rounded border border-slate-300 px-3 h-8 inline-flex items-center justify-center cursor-pointer font-medium text-slate-700 transition hover:bg-slate-100"
                  @click="emit('edit', row)"
                >
                  Edit
                </button>
                <button
                  v-if="!row.deleted_at"
                  type="button"
                  class="rounded border border-rose-200 px-3 h-8 inline-flex items-center justify-center cursor-pointer font-medium text-rose-700 transition hover:bg-rose-50"
                  @click="emit('archive', row)"
                >
                  Archive
                </button>
                <button
                  v-else
                  type="button"
                  class="rounded border border-emerald-200 px-3 h-8 inline-flex items-center justify-center cursor-pointer font-medium text-emerald-700 transition hover:bg-emerald-50"
                  @click="emit('restore', row)"
                >
                  Restore
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td
              :colspan="resource.tableFields.length + 2"
              class="px-4 py-10 text-center text-sm text-slate-500"
            >
              No records found for the current filter.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
