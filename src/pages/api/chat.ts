import type { NextApiRequest, NextApiResponse } from 'next'
import { dialog } from 'src/constans'
import { osteoporosisCase } from 'src/cases/osteoporosis'
import {
  ChatMessage,
  createOpenAIClient,
  getModel,
  getNumberEnv,
  validateMessages,
  buildSystemPromptWithCase,
} from 'src/lib/ai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Метод не дозволений' })
    return
  }

  const body = req.body as { messages?: ChatMessage[] }
  const messages = body?.messages

  if (!validateMessages(messages)) {
    res.status(400).json({ message: 'Повідомлення не надані або мають неправильний формат' })
    return
  }

  const model = getModel()
  const temperature = getNumberEnv('OPENAI_TEMPERATURE', 0.7)
  const top_p = getNumberEnv('OPENAI_TOP_P', 1)
  const frequency_penalty = getNumberEnv('OPENAI_FREQUENCY_PENALTY', 0.3)

  try {
    const client = createOpenAIClient()
    const system = buildSystemPromptWithCase(dialog, osteoporosisCase)
    const completion = await client.chat.completions.create({
      model,
      temperature,
      top_p,
      frequency_penalty,
      messages: [{ role: 'system', content: system }, ...messages],
    })

    const botReply = completion.choices[0]?.message?.content ?? ''
    res.status(200).json({ reply: botReply })
  } catch (error) {
    console.error('chat error:', error)
    res.status(500).json({ message: 'Помилка сервера' })
  }
}
