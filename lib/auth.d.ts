interface UrlOptions {
  // redirect_uri
  // @default: window.location.href
  redirect?: string
  // use authorization code flow?
  // @default: false (implicit code flow)
  code?: boolean

  // re-prompt user
  // @default: false
  force_verify?: boolean
  // anti-csrf token
  state?: string
}

export function createUrl(clientId: string, scope: string, opts?: UrlOptions): string

interface ValidationResponse {
  login: string
  user_id: string
  client_id: string
  expires_in: number
  scopes: string[]
}

export function validate(token: string): Promise<ValidationResponse>

export function revoke(clientId: string, token: string): Promise<void>
