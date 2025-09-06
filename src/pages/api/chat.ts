import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

import { dialog } from 'src/constans'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Метод не дозволений' })
    return
  }

  const { messages } = req.body as { messages: Message[] }

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ message: 'Повідомлення не надані або мають неправильний формат' })

    return
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages: [{ role: 'system', content: dialog }, ...messages],
    })

    const botReply = completion.choices[0].message?.content

    res.status(200).json({ reply: botReply })
  } catch (error) {
    console.error('Помилка при виклику OpenAI API:', error)
    res.status(500).json({ message: 'Помилка сервера' })
  }
}
