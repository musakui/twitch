const ID_URL = 'https://id.twitch.tv/oauth2'
const API_URL = 'https://api.twitch.tv/helix'

export const create = (token) => {
  let res = null

  const headers = {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  }

  const info = new Promise((resolve) => { res = resolve })

  const api = async (path, data) => {
    const opts = { headers }
    if (data) {
      opts.method = 'POST'
      opts.body = JSON.stringify(data)
    }
    await info
    const r = await fetch(`${API_URL}/${path}`, opts)
    return await r.json()
  }

  fetch(`${ID_URL}/validate`, { headers }).then(async (r) => {
    const { client_id, expires_in, ...info } = await r.json()
    headers['client-id'] = client_id
    Object.assign(api, { info })
    res(info)
  })

  return api
}
