// Proxy de la pantalla de ADIF en el mismo dominio: evita el bloqueo del iframe
const ADIF = 'https://info.adif.es'
const PROXIED = ['/assets/gravita/', '/recursos/']

async function handle(request, env) {
  const url = new URL(request.url)
  if (url.pathname === '/manifest.webmanifest') return screenManifest(url)
  if (!PROXIED.some((p) => url.pathname.startsWith(p))) return env.ASSETS.fetch(request)

  const upstream = new Request(ADIF + url.pathname + url.search, request)
  upstream.headers.set('Origin', ADIF)
  upstream.headers.set('Referer', ADIF + '/')
  const res = await fetch(upstream)
  if (url.pathname === '/assets/gravita/adif_infotren_vista.js' && res.ok) return patchFontSize(res)

  const out = new Response(res.body, res)
  out.headers.delete('X-Frame-Options')
  out.headers.delete('Content-Security-Policy')
  return out
}

// Manifest de cada pantalla, para instalarla como app (cada URL es una app distinta)
function screenManifest(url) {
  const u = url.searchParams.get('u') || '/'
  const start = u.startsWith('/') && !u.startsWith('//') ? u : '/'
  const name = (url.searchParams.get('n') || 'Pantallas').slice(0, 80)
  const detail = (url.searchParams.get('d') || '').slice(0, 80)
  const color = /^#[0-9a-f]{6}$/i.test(url.searchParams.get('c') || '')
    ? url.searchParams.get('c')
    : '#bfefd5'
  const icon = (size) => ({
    src: `/icon-${size}.png`,
    sizes: `${size}x${size}`,
    type: 'image/png',
    purpose: 'any maskable',
  })
  const manifest = {
    id: start,
    name: detail ? `${name} · ${detail}` : name,
    short_name: name.split(' - ').pop(),
    start_url: start,
    scope: '/',
    display: 'standalone',
    background_color: '#001b41',
    theme_color: color,
    icons: [icon(192), icon(512)],
  }
  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

// Tamaño de fuente "Extra" (font-size=4) para el móvil en vertical: añade al script de ADIF un
// caso 4 con menos filas (más altas) y columnas proporcionales. Si ADIF cambia alguna de estas
// líneas, no se toca nada y el tamaño 4 se ve como Grande
const FONT_SIZE_PATCHES = [
  ['if (font_size > 3) font_size = 3;', 'if (font_size > 4) font_size = 4;'],
  [
    'num_rows = Math.round(((16 / 9) * 7) / aspect_ratio) - 1;',
    'num_rows = Math.round(((16 / 9) * 7) / aspect_ratio) - 1;\n break;\n case 4: num_rows = Math.round(((16 / 9) * 5) / aspect_ratio) - 1;',
  ],
  ['factor = 9 / 7;', 'factor = 9 / 7;\n break;\n case 4: factor = 9 / 5;'],
  // El ancho del logo ya crece con la fila; en el caso 4 no se multiplica otra vez por el factor
  [
    'widths["commercial_id"] * factor;',
    'widths["commercial_id"] * (font_size === 4 ? 1 : factor);',
  ],
  // La vía solo necesita sitio para dos cifras
  [
    'widths["platform"] = (11 - font_size) * factor;',
    'widths["platform"] = font_size === 4 ? 9 : (11 - font_size) * factor;',
  ],
]

async function patchFontSize(res) {
  let body = await res.text()
  if (FONT_SIZE_PATCHES.every(([from]) => body.includes(from))) {
    for (const [from, to] of FONT_SIZE_PATCHES) body = body.replaceAll(from, to)
  }
  const headers = new Headers(res.headers)
  headers.delete('Content-Length')
  headers.delete('Content-Encoding')
  headers.delete('Content-Security-Policy')
  return new Response(body, { status: res.status, headers })
}

export default {
  async fetch(request, env) {
    try {
      return await handle(request, env)
    } catch (err) {
      console.error(err)
      return new Response(`Error en el Worker:\n${err?.stack || err}`, {
        status: 502,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }
  },
}
