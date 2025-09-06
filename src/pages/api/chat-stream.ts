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
      const delta = part.choices?.[0]?.delta?.content
      if (delta) res.write(`data: ${delta}\n\n`)
    }
    res.write('data: [DONE]\n\n')
    res.end()
  } catch (e) {
    console.error('chat-stream error:', e)
    res.write('data: [ERROR]\n\n')
    res.end()
  }
}
