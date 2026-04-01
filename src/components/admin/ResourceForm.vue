<script setup>
const props = defineProps({
  resource: {
    type: Object,
    required: true,
  },
  modelValue: {
    type: Object,
    required: true,
  },
  relationOptions: {
    type: Object,
    required: true,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const updateField = (fieldKey, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [fieldKey]: value,
  })
}

const getOptions = (field) => props.relationOptions[field.relation] || []
</script>

<template>
  <form class="space-y-5" @submit.prevent="emit('submit')">
    <div class="grid gap-5 md:grid-cols-2">
      <div v-for="field in resource.fields" :key="field.key" :class="field.type === 'textarea' ? 'md:col-span-2' : ''">
        <label :for="field.key" class="mb-2 block text-sm font-semibold text-slate-700">
          {{ field.label }}
        </label>

        <textarea
          v-if="field.type === 'textarea'"
          :id="field.key"
          :value="modelValue[field.key]"
          :required="field.required"
          rows="5"
          class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          @input="updateField(field.key, $event.target.value)"
        />

        <select
          v-else-if="field.type === 'select' || field.type === 'relation'"
          :id="field.key"
          :value="modelValue[field.key]"
          :required="field.required"
          class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          @change="updateField(field.key, $event.target.value)"
        >
          <option value="">{{ field.nullable ? 'None' : `Select ${field.label}` }}</option>
          <option
            v-for="option in field.type === 'relation' ? getOptions(field) : field.options"
            :key="field.type === 'relation' ? option.id : option"
            :value="field.type === 'relation' ? option.id : option"
          >
            {{ field.type === 'relation' ? option[field.optionLabel] ?? `#${option.id}` : option }}
          </option>
        </select>

        <input
          v-else
          :id="field.key"
          :type="field.type"
          :value="modelValue[field.key]"
          :required="field.required"
          :step="field.step"
          :min="field.min"
          :max="field.max"
          class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          @input="updateField(field.key, $event.target.value)"
        />
      </div>
    </div>

    <div class="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
      <button
        type="submit"
        class="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="submitting"
      >
        {{ submitting ? 'Saving...' : 'Save record' }}
      </button>
    </div>
  </form>
</template>
