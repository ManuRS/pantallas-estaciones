<template>
  <section
    aria-labelledby="share-screen-title"
    class="bg-slate-800 rounded-xl shadow-2xl p-4 border border-slate-700"
  >
    <div class="flex items-center justify-between mb-3">
      <h3 id="share-screen-title" class="text-base font-medium text-white">Compartir pantalla</h3>
      <button
        @click="short = !short"
        :aria-pressed="short"
        class="px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
        :class="
          short ? 'bg-dark-green text-dark-blue' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        "
      >
        URL corta
      </button>
    </div>
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <input
        :value="shownUrl"
        readonly
        :disabled="props.disabled"
        aria-label="Screen sharing URL"
        class="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm min-w-0"
        :class="{ 'opacity-50': props.disabled }"
      />
      <div class="flex gap-2 sm:flex-shrink-0">
        <button
          @click="copyUrl"
          :disabled="props.disabled"
          aria-label="Copy screen sharing URL"
          :class="[
            'px-4 py-3 rounded-lg transition-colors flex items-center justify-center flex-1 sm:flex-initial cursor-pointer',
            copied
              ? 'bg-white text-dark-blue'
              : 'bg-dark-green hover:bg-light-green text-dark-blue',
            props.disabled ? 'opacity-50 cursor-not-allowed' : '',
          ]"
        >
          <CopyIcon v-if="!copied" aria-hidden="true" />
          <div v-else class="w-4 h-4">
            <CheckmarkIcon aria-hidden="true" />
          </div>
        </button>
        <button
          @click="openUrl"
          :disabled="props.disabled"
          aria-label="Open screen sharing URL"
          class="px-4 py-3 bg-dark-green text-dark-blue rounded-lg hover:bg-light-green transition-colors flex items-center justify-center flex-1 sm:flex-initial cursor-pointer"
          :class="{ 'opacity-50 cursor-not-allowed': props.disabled }"
        >
          <ExternalLinkIcon aria-hidden="true" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { parseUrlParamsToFormData, convertFormDataToGravitaProps } from '../utils/format'
import { addRecent } from '../utils/recent'
import CopyIcon from './icons/CopyIcon.vue'
import CheckmarkIcon from './icons/CheckmarkIcon.vue'
import ExternalLinkIcon from './icons/ExternalLinkIcon.vue'

const props = defineProps({
  url: String,
  disabled: {
    type: Boolean,
    default: false,
  },
})

const copied = ref(false)
const short = ref(true)

// Quita los parámetros que no cambian la pantalla (los que ya tienen su valor por defecto)
function shortenUrl(url) {
  const u = new URL(url)
  const parse = () =>
    JSON.stringify(convertFormDataToGravitaProps(parseUrlParamsToFormData(u.searchParams)))
  const target = parse()
  for (const key of [...u.searchParams.keys()]) {
    if (key === 'station') continue
    const value = u.searchParams.get(key)
    u.searchParams.delete(key)
    if (parse() !== target) u.searchParams.set(key, value)
  }
  return u.toString()
}

const shownUrl = computed(() => (short.value && props.url ? shortenUrl(props.url) : props.url))

const copyUrl = async () => {
  if (props.disabled) return

  try {
    await navigator.clipboard.writeText(shownUrl.value)
    addRecent(shownUrl.value)
    window?.gtag?.('event', 'url_copy_click')
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Error copying URL:', err)
  }
}

const openUrl = () => {
  if (props.disabled) return
  addRecent(shownUrl.value)
  window.open(shownUrl.value, '_blank')

  window?.gtag?.('event', 'url_open_click')
}
</script>
