export const oauthURL = 'https://id.twitch.tv/oauth2'

export const createUrl = (client_id, scope, opts) => {
  if (!client_id || !scope) throw new Error('client_id and scope are required')
  const { code, redirect, ...r } = opts || {}
  const qs = new URLSearchParams(Object.assign({
    client_id, scope,
    response_type: code ? 'code' : 'token',
    redirect_uri: (redirect || window.location.href),
  }, r))
  return `${oauthURL}/authorize?${qs}`
}

export const validate = (token) => fetch(`${oauthURL}/validate`, {
  headers: {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  },
}).then((r) => r.json())

export const revoke = (client_id, token) => fetch(`${oauthURL}/revoke`, {
  method: 'POST',
  body: new URLSearchParams({ client_id, token }),
})
