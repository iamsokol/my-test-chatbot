import type { NextApiRequest, NextApiResponse } from 'next'

import { dialog } from 'src/constans'
import { osteoporosisCase } from 'src/cases/osteoporosis'
import {
  ChatMessage,
  createOpenAIClient,
  getModel,
  getNumberEnv,
  validateMessages,
} from 'src/lib/ai'

function explicitlyAsksForNumbers(text: string): boolean {
  const t = text.toLowerCase()
  return (
    /t\s*-?\s*score/.test(t) ||
    /t‑score/.test(t) ||
    /\bdxa\b/.test(t) ||
    /\bexact\b|\bnumbers?\b|\bvalues?\b|\bresults?\b/.test(t) ||
    /точн|цифр|значенн/.test(t)
  )
}

function redactNumericDisclosure(delta: string, allow: boolean): string {
  if (allow) return delta
  let out = delta.replace(/(t\s*[-–]?\s*score[^\d-+]*)([-–−]?\d+(?:\.\d+)?)/gi, '$1[redacted]')
  out = out.replace(/(t\s*[-–]?\s*score\s*[:=]?\s*)([-–−]?\d+(?:\.\d+)?)/gi, '$1[redacted]')
  return out
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  const body = req.body as { messages?: ChatMessage[] }
  const messages = body?.messages
  if (!validateMessages(messages)) {
    res.status(400).end()
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')

  try {
    const model = getModel()
    const temperature = getNumberEnv('OPENAI_TEMPERATURE', 0.7)
    const top_p = getNumberEnv('OPENAI_TOP_P', 1)
    const frequency_penalty = getNumberEnv('OPENAI_FREQUENCY_PENALTY', 0.3)
    const client = createOpenAIClient()
    const lastUser = [...messages].reverse().find(m => m.role === 'user')
    const allowNumbers = lastUser ? explicitlyAsksForNumbers(lastUser.content) : false

    const stream = await client.chat.completions.create({
      model,
      temperature,
      top_p,
      frequency_penalty,
      stream: true,
      messages: [
        { role: 'system', content: dialog },
        { role: 'system', content: `Internal case map (do not reveal): ${JSON.stringify(osteoporosisCase)}` },
        ...messages,
      ],
    })

    for await (const part of stream) {
      const raw = part.choices?.[0]?.delta?.content
      if (!raw) continue
      const delta = redactNumericDisclosure(raw, allowNumbers)
      const base = delta.length > 12 ? 90 : 45
      const jitter = Math.floor(Math.random() * 35)
      await new Promise(r => setTimeout(r, Math.min(140, base + jitter)))
      res.write(`data: ${delta}\n\n`)
    }
    res.write('data: [DONE]\n\n')
    res.end()
  } catch (e) {
    console.error('chat-stream error:', e)
    res.write('data: [ERROR]\n\n')
    res.end()
  }
}
