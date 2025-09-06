import process from 'process'
import OpenAI from 'openai'

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export function getAllowedModels(): string[] {
  const fromEnv = process.env.OPENAI_ALLOWED_MODELS
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv.split(',').map(s => s.trim())
  // Сучасні, Chat Completions-сумісні та оптимальні для симуляції пацієнта (UA/EN):
  // - gpt-4o: найприродніший стиль, краща "людяність"
  // - gpt-4o-mini-2024-07-18 / gpt-4o-mini: дешевше, швидше, гарна якість
  return ['gpt-4o', 'gpt-4o-mini-2024-07-18', 'gpt-4o-mini']
}

export function getModel(): string {
  // Дефолт: стабільна chat.completions-модель
  const model = (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim()
  const allowed = getAllowedModels()
  return allowed.includes(model) ? model : allowed[0]
}

export function getNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const num = Number(raw)
  return Number.isFinite(num) ? num : fallback
}

export function validateMessages(messages: unknown): messages is ChatMessage[] {
  if (!Array.isArray(messages)) return false
  return messages.every(
    m =>
      m &&
      (m as ChatMessage).role &&
      ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant') &&
      typeof (m as ChatMessage).content === 'string',
  )
}

export function createOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}
