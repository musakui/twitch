interface ChatOptions {
  url?: string
  name?: string
  token?: string
  requirements?: string[]
}

interface RoomState {
  emoteOnly?: string
}

interface ChatRoom {
  name: string
  state: RoomState
  part (): void
  say (text: string): void
}

type EventName = 'ready' | 'chat' | 'info'
type EventHandler = (details: any) => void
type EventHandlerRemover = () => void

declare class Chat extends WebSocket {
  constructor(opts?: ChatOptions)
  user: string
  on(name: EventName, handler: EventHandler): EventHandlerRemover
  join(name: string): Promise<ChatRoom>
}
