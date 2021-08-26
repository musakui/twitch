type EventHandler = (details: any) => void
type EventHandlerRemover = () => void

interface PubSubOptions {
  url?: string
}

declare class PubSub extends WebSocket {
  constructor(token: string, topics: object, opts?: PubSubOptions)
  on(name: string, handler: EventHandler): EventHandlerRemover
}
