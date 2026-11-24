// Proxy de la pantalla de ADIF en el mismo dominio: evita el bloqueo del iframe
const ADIF = 'https://info.adif.es'
const PROXIED = ['/assets/gravita/', '/recursos/']

async function handle(request, env) {
  const url = new URL(request.url)
  if (!PROXIED.some((p) => url.pathname.startsWith(p))) return env.ASSETS.fetch(request)

  const upstream = new Request(ADIF + url.pathname + url.search, request)
  upstream.headers.set('Origin', ADIF)
  upstream.headers.set('Referer', ADIF + '/')
  const res = await fetch(upstream)

  const out = new Response(res.body, res)
  out.headers.delete('X-Frame-Options')
  out.headers.delete('Content-Security-Policy')
  return out
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
