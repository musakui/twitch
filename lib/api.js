let res = null

const headers = {
  'content-type': 'application/json',
}

const ready = new Promise((resolve) => { res = resolve })

export const helixURL = 'https://api.twitch.tv/helix'

export const use = (token, clientId) => {
  Object.assign(headers, {
    authorization: `Bearer ${token}`,
    'client-id': clientId,
  })
  res()
}

export const raw = async (path, params, post) => {
  const opts = { headers }
  if (post) {
    opts.method = 'POST'
    if (typeof post === 'object') {
      opts.body = JSON.stringify(post)
    }
  }
  await ready
  const qs = params ? `?${new URLSearchParams(params)}` : ''
  const r = await fetch(`${helixURL}/${path}${qs}`, opts)
  return await r.json()
}
