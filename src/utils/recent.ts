import { computed, ref } from 'vue'
import { Companies, Interfaces, Products, Stations, Traffics } from '../constants'
import { convertFormDataToGravitaProps, parseUrlParamsToFormData } from './format'

// Últimas pantallas abiertas o copiadas, guardadas en este navegador
const KEY = 'pantallas-recientes'
const MAX = 5

const load = (): string[] => {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(value) ? value.filter((v) => typeof v === 'string') : []
  } catch {
    return []
  }
}

const urls = ref<string[]>(load())

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(urls.value))
  } catch {}
}

const sameCode = (a: string, b: string) => a.replace(/^0+/, '') === b.replace(/^0+/, '')
const stationName = (code: string) =>
  (Stations.find((s) => sameCode(s.code, code))?.name || code).replace(/\s*\([^)]*\)\s*$/, '')
const labels = (list: { key: string; label: string }[], keys: string[]) =>
  keys.map((k) => list.find((i) => i.key === k)?.label || k).join(', ')

// Identifica la pantalla aunque la URL venga en versión corta o completa
const screenKey = (url: string) => {
  const params = new URL(url).searchParams
  return JSON.stringify(convertFormDataToGravitaProps(parseUrlParamsToFormData(params)))
}

export const describeScreen = (url: string) => {
  const data = parseUrlParamsToFormData(new URL(url).searchParams)
  const defaultTraffic = ['cercanias', 'av', 'largaDistancia', 'regional']
  const allTraffic =
    data.traffic.length === defaultTraffic.length &&
    defaultTraffic.every((t) => data.traffic.includes(t))
  const detail = [
    Interfaces.find((i) => i.key === data.interfaz)?.label,
    !allTraffic && labels(Traffics, data.traffic),
    data.customFilter.join(', '),
    data.platformFilter.length && `Vía ${data.platformFilter.join(', ')}`,
    labels(Products, data.productFilter),
    labels(Companies, data.companyFilter),
    data.stopFilter.length && `Para en ${data.stopFilter.map(stationName).join(', ')}`,
  ]
    .filter(Boolean)
    .join(' · ')
  return { url, title: stationName(data.stationCode), detail }
}

export const recentScreens = computed(() =>
  urls.value.flatMap((url) => {
    try {
      return [describeScreen(url)]
    } catch {
      return []
    }
  }),
)

export function addRecent(url: string) {
  try {
    const key = screenKey(url)
    urls.value = [url, ...urls.value.filter((u) => screenKey(u) !== key)].slice(0, MAX)
    save()
  } catch {}
}

export function removeRecent(url: string) {
  urls.value = urls.value.filter((u) => u !== url)
  save()
}
