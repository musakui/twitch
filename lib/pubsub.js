const defaultUrl = 'wss://pubsub-edge.twitch.tv'

const ping = JSON.stringify({ type: 'PING' })
const startup = (data, nonce) => JSON.stringify({ type: 'LISTEN', data, nonce })

export class PubSub extends WebSocket {
  constructor (auth_token, subs, opts = {}) {
    if (!auth_token) throw new TypeError('token required')
    const topicMap = new Map(Object.entries(subs).map(([k, v]) => [v, k]))
    if (!topicMap?.size) throw new TypeError('topics required')

    super(opts.url || defaultUrl)
    const nonce = Math.random().toString(36).slice(2)

    this.addEventListener('open', async () => {
      const topics = [...topicMap.keys()]
      this.send(startup({ topics, auth_token }, nonce))
      while (this.readyState === 1) {
        this.send(ping)
        const delay = 2e5 + Math.random() * 100
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    })

    this.addEventListener('message', ({ data: msg }) => {
      const { error, data, ...d } = JSON.parse(msg)
      if (error || (d.nonce && d.nonce !== nonce)) {
        const err = new Error(error || 'nonce mismatch')
        this.dispatchEvent(new ErrorEvent('error', err))
        this.close()
      } else if (d.type === 'MESSAGE') {
        const name = topicMap.get(data.topic)
        const detail = JSON.parse(data.message).data
        this.dispatchEvent(new CustomEvent(name, { detail }))
      }
    })
  }

  on (name, handler) {
    const h = ({ detail }) => handler(detail)
    this.addEventListener(name, h)
    return () => this.removeEventListener(name, h)
  }
}

export const create = (token, topics, opts) => new PubSub(token, topics, opts)

export * as Topics from './pubsub-topics.js'
