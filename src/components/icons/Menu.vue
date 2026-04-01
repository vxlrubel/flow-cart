<script setup>
defineProps({
  size: {
    type: [String, Number],
    default: 24,
  },
  color: {
    type: String,
    default: 'currentColor',
  },
})
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :height="size"
    :width="size"
    viewBox="0 -960 960 960"
    :fill="color"
  >
    <path
      d="M100.78-212.3v-106h758.44v106H100.78Zm0-214.7v-106h758.44v106H100.78Zm0-214.7v-106h758.44v106H100.78Z"
    />
  </svg>
</template>
