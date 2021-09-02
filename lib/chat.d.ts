interface ChatOptions {
  url?: string
  name?: string
  token?: string
  requirements?: string[]
}

interface RoomState {
  roomId: string
  r9k?: string
  slow?: string
  rituals?: string
  subsOnly?: string
  emoteOnly?: string
  followersOnly?: string
}

interface ChatRoom {
  name: string
  state: RoomState
  part(): void
  say(text: string): void
}

interface ChatEvent {
  command: string
  raw?: string
  chan?: string
  user?: string
  text?: string
  tags?: Record<string, string>

  // only for NAMES
  join?: string[]
  part?: string[]
}

type EventName = 'info' | 'chat'
type EventHandler = (details: ChatEvent) => void
type EventHandlerRemover = () => void

declare class Chat extends WebSocket {
  constructor(opts?: ChatOptions)
  connected: boolean
  user: string
  on(name: EventName, handler: EventHandler): EventHandlerRemover
  join(name: string): Promise<ChatRoom>
}

export function create(opts?: ChatOptions): Chat

type ChatFragments = any[]
type CheerProcessor = (fragments: ChatFragments) => ChatFragments

interface CheermoteInfo {
  prefix: string
  tiers: object[]
}

export function createCheerProcessor(cheermotes: CheermoteInfo[]): CheerProcessor

export function getFragments(message: { text: string, tags: object }): {
  action?: boolean,
  fragments: ChatFragments,
}
