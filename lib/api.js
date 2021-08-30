const API_URL = 'https://api.twitch.tv/helix'

export const create = (token, clientId) => {
  const headers = {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
    'client-id': clientId,
  }

  return async (path, params, post) => {
    const opts = { headers }
    if (post) {
      opts.method = 'POST'
      if (typeof post === 'object') {
        opts.body = JSON.stringify(post)
      }
    }
    const qs = params ? `?${new URLSearchParams(params)}` : ''
    const r = await fetch(`${API_URL}/${path}${qs}`, opts)
    return await r.json()
  }
}
