type Topic = string

type EventHandler = (details: any) => void
type EventHandlerRemover = () => void

interface PubSubOptions {
  url?: string
}

declare class PubSub extends WebSocket {
  constructor(opts?: PubSubOptions)
  on(name: Topic, handler: EventHandler): EventHandlerRemover
  subscribe(topics: Topic[], token: string): Promise<Topic[]>
}

export function create(opts?: PubSubOptions): PubSub

declare namespace Topics {
  export function bits(id: string): Topic
  export function bitsBadge(id: string): Topic
  export function channelPoints(id: string): Topic
  export function channelSubscriptions(id: string): Topic
  export function whispers(id: string): Topic
}
