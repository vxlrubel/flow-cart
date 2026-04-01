<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :height="size"
    viewBox="0 -960 960 960"
    :width="size"
    :fill="color"
    aria-hidden="true"
  >
    <path d="M480-498 299-317l-85-84 266-266 266 266-85 84-181-181Z" />
  </svg>
</template>

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
