<script setup>
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import KeyboardArrowUp from '@/components/icons/KeyboardArrowUp.vue'
import Grocery from '@/components/icons/Grocery.vue'
import Menu from '@/components/icons/Menu.vue'
import SidebarItems from '@/components/SidebarItems.vue'

let toggle = ref(false)

const toggleSidebar = () => {
  toggle.value = !toggle.value
}

// scroll to top
const scroll_to_top = () => {
  const scroll_container = document.getElementById('scroll-container')
  if (scroll_container) {
    scroll_container.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>

<template>
  <main class="min-h-screen flex flex-col md:flex-row">
    <aside
      class="w-full md:border-r border-gray-200 duration-100"
      :class="toggle ? 'md:w-15' : 'md:w-64'"
    >
      <div class="flex px-4 h-[40px] items-center border-b border-gray-200">
        <RouterLink to="/admin/dashboard" class="flex items-center text-blue-500 font-bold">
          <Grocery size="28" />
          <span class="ml-1 text-xl overflow-hidden" v-if="!toggle" :class="toggle ? 'w-0' : 'w-25'"
            >Flow Cart</span
          >
        </RouterLink>
      </div>
      <nav class="flex flex-col p-4 space-y-1 md:h-[calc(100dvh-40px)] md:overflow-y-auto">
        <SidebarItems />
      </nav>
    </aside>
    <div class="flex-1">
      <header class="px-4 border-b border-neutral-200 h-[40px] flex items-center">
        <button
          @click="toggleSidebar"
          type="button"
          class="text-neutral-700 cursor-pointer h-8 w-8 inline-flex justify-center items-center"
        >
          <Menu size="28" />
        </button>
      </header>
      <div class="h-[calc(100dvh-40px)] overflow-y-scroll bg-gray-100 p-4" id="scroll-container">
        <RouterView />

        <button
          type="button"
          class="bg-blue-500 text-white h-8 w-9 flex items-center justify-center bg-neutral-700 duration-100 hover:bg-neutral-800 right-10 rounded cursor-pointer bottom-4 fixed"
          @click="scroll_to_top"
        >
          <KeyboardArrowUp size="28" color="#fff" />
        </button>
      </div>
    </div>
  </main>
</template>
