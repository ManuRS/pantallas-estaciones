<template>
  <section
    v-if="recentScreens.length"
    aria-labelledby="recent-screens-title"
    class="bg-slate-800 rounded-xl shadow-2xl p-4 border border-slate-700"
  >
    <h3 id="recent-screens-title" class="text-base font-medium text-white mb-3">Recientes</h3>
    <ul class="flex flex-col gap-2">
      <li v-for="item in recentScreens" :key="item.url" class="flex items-center gap-2">
        <a
          :href="item.url"
          class="flex-1 min-w-0 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
        >
          <span class="block text-sm text-white truncate">{{ item.title }}</span>
          <span v-if="item.detail" class="block text-xs text-slate-400 truncate">{{
            item.detail
          }}</span>
        </a>
        <button
          @click="removeRecent(item.url)"
          aria-label="Quitar"
          class="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ClearIcon aria-hidden="true" />
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup>
import ClearIcon from './icons/ClearIcon.vue'
import { recentScreens, removeRecent } from '../utils/recent'
</script>
