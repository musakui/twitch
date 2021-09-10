const defaultUrl = 'wss://pubsub-edge.twitch.tv'

const requests = new Map()
const ping = JSON.stringify({ type: 'PING' })

export class PubSub extends WebSocket {
  #ready = null

  constructor (opts = {}) {
    super(opts.url || defaultUrl)

    let res = null
    this.#ready = new Promise((resolve) => { res = resolve })
    this.addEventListener('open', async () => {
      res()
      while (this.readyState === 1) {
        this.send(ping)
        const delay = 2e5 + Math.random() * 100
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    })

    this.addEventListener('message', ({ data: msg }) => {
      const { type, nonce, error, data } = JSON.parse(msg)
      if (type === 'RESPONSE' && requests.has(nonce)) {
        const [resolve, reject] = requests.get(nonce)
        error ? reject(error) : resolve()
      } else if (type === 'MESSAGE') {
        const detail = JSON.parse(data.message)
        this.dispatchEvent(new CustomEvent(data.topic, { detail }))
      }
    })
  }

  get connected () {
    return this.readyState === 1
  }

  on (name, handler) {
    const h = ({ detail }) => handler(detail)
    this.addEventListener(name, h)
    return () => this.removeEventListener(name, h)
  }

  async subscribe (topics, auth_token) {
    if (!auth_token) throw new Error('token required')
    if (!topics.length) throw new Error('topics required')
    const nonce = Math.random().toString(36).slice(2)
    await this.#ready
    this.send(JSON.stringify({
      type: 'LISTEN', nonce,
      data: { topics, auth_token },
    }))
    await new Promise((resolve, reject) => requests.set(nonce, [resolve, reject]))
    return topics
  }
}

export const create = (token, topics, opts) => new PubSub(token, topics, opts)

export * as Topics from './pubsub-topics.js'
