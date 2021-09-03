type Topic = string

type EventHandler = (details: any) => void
type EventHandlerRemover = () => void

interface PubSubOptions {
  url?: string
}

declare class PubSub extends WebSocket {
  constructor(token: string, topics: Record<string, Topic>, opts?: PubSubOptions)
  on(name: string, handler: EventHandler): EventHandlerRemover
}

export function create(token: string, topics: Record<string, Topic>, opts?: PubSubOptions): PubSub

declare namespace Topics {
  export function bits(id: string): Topic
  export function bitsBadge(id: string): Topic
  export function channelPoints(id: string): Topic
  export function channelSubscriptions(id: string): Topic
  export function whispers(id: string): Topic
}
