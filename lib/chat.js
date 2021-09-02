const prefix = 'oauth:'
const defaultUrl = 'wss://irc-ws.chat.twitch.tv:443'
const defaultReqs = ['tags', 'commands', 'membership']

const ircRegex = /(?:@(?<t>\S+) )?:(?<p>\S+) (?<c>\S+)(?: (?<a>.+))?\r/

const commandMap = new Map([
  ['CAP', false],
  ['353', 'NAMES'],
  ['376', 'READY'],
])

const createSay = (ws, chan) => (text) => ws.send(`PRIVMSG ${chan} : ${text}`)

const getReqs = (reqs) => 'CAP REQ :' + reqs.map((r) => `twitch.tv/${r}`).join(' ')

const getUser = (name, token) => {
  if (!name) return {
    name: `justinfan${Math.floor(1e3 + Math.random() * 8e4)}`,
    pass: null,
  }
  if (!token) throw new Error('token required')
  return {
    name,
    pass: `${token.startsWith(prefix) ? '' : prefix}${token}`,
  }
}

const parseLine = (raw) => {
  const grps = raw?.match(ircRegex)?.groups
  if (!grps) return
  const { c, a, p, t } = grps
  const cmd = commandMap.get(c)
  if (cmd === false || (!cmd && parseInt(c))) return
  return {
    command: (cmd || c),
    get tags () {
      delete this.tags
      if (!t) return undefined
      return this.tags = Object.fromEntries(parseTags(t))
    },
    get chan () {
      delete this.text
      delete this.chan
      if (!a) return undefined
      ;[this.chan, this.text] = a.split(' :', 2)
      return this.chan
    },
    get user () {
      delete this.user
      if (!p.includes('!')) return undefined
      return this.user = p.split('!')[0]
    },
    get text () {
      delete this.text
      delete this.chan
      if (!a) return undefined
      ;[this.chan, this.text] = a.split(' :', 2)
      return this.text
    },
    get raw () {
      delete this.raw
      return this.raw = raw
    },
  }
}

const processTag = new Map([
  ['mod', false],
  ['turbo', false],
  ['subscriber', false],
])

const tagReplacements = [
  [/\\s/g, ' '],
  [/\\\\/g, '\\'],
  // [/\\:/g, ';'],
]

function * parseTags (tags) {
  for (const [reg, replace] of tagReplacements) {
    tags = tags.replace(reg, replace)
  }
  for (const tag of tags.split(';')) {
    const [key, val] = tag.split('=')
    const process = processTag.get(key)
    if (process === false) continue
    yield [
      key.replace(/-./g, (t) => t[1].toUpperCase()),
      process ? process(val) : val
    ]
  }
}

export class Chat extends WebSocket {
  #user = null
  #joins = new Map()

  constructor (opts = {}) {
    super(opts.url || defaultUrl)

    const emit = (name, detail) => this.dispatchEvent(new CustomEvent(name, { detail }))
    const user = getUser(opts.name, opts.token)

    this.addEventListener('open', () => {
      this.send(getReqs(opts.requirements || defaultReqs))
      if (user.pass) this.send(`PASS ${user.pass}`)
      this.send(`NICK ${user.name}`)
    })

    this.addEventListener('message', ({ data: msg }) => {
      if (msg.startsWith('PING')) return this.send(msg.replace('I', 'O'))
      let chan = null
      const names = {
        JOIN: new Set(),
        PART: new Set(),
      }
      for (const info of msg.split('\n').map(parseLine)) {
        if (!info) continue
        switch (info.command) {
          case 'NAMES':
            chan = info.chan.split(' = ')[1]
            for (const n of info.text.split(' ')) names.JOIN.add(n)
            break
          case 'JOIN':
          case 'PART':
            chan = info.chan
            names[info.command].add(info.user)
            break
          case 'PRIVMSG':
            emit('chat', info)
            break
          case 'NOTICE':
            if (info.text === 'Login authentication failed') {
              this.dispatchEvent(new ErrorEvent('error', { message: info.text }))
              this.close()
              break
            }
            emit('info', info)
            break
          case 'ROOMSTATE':
            if (this.#joins.has(info.chan)) {
              this.#joins.get(info.chan)(info.tags)
              this.#joins.delete(info.chan)
            }
          default:
            emit('info', info)
        }
      }
      if (chan) emit('info', {
        command: 'NAMES',
        chan,
        join: [...names.JOIN],
        part: [...names.PART],
      })
    })

    this.#user = user
  }

  get connected () {
    return this.readyState === 1
  }

  get user () {
    return this.#user.name
  }

  on (name, handler) {
    const h = ({ detail }) => handler(detail)
    this.addEventListener(name, h)
    return () => this.removeEventListener(name, h)
  }

  async join (chan) {
    if (!chan) return
    const c = `#${chan}`
    this.send(`JOIN ${c}`)
    try {
      const state = await new Promise((resolve, reject) => {
        this.#joins.set(c, resolve)
        setTimeout(reject, 500)
      })
      return {
        name: chan,
        state,
        say: this.#user.pass ? createSay(this, c) : null,
        part: () => this.send(`PART ${c}`),
      }
    } catch (er) {
      return null
    }
  }
}

export const create = (opts) => new Chat(opts)

export * from './chat-message.js'
