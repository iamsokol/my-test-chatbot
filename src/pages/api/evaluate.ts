import type { NextApiRequest, NextApiResponse } from 'next'
import { osteoporosisCase } from 'src/cases/osteoporosis'
import { buildEvaluationPrompt } from 'src/lib/case'
import { ChatMessage, createOpenAIClient, detectTranscriptLanguage, getModel, validateMessages } from 'src/lib/ai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') { res.status(405).json({ message: 'Метод не дозволений' }); return }

  const body = req.body as { transcript?: ChatMessage[] }
  const transcript = body?.transcript
  if (!validateMessages(transcript)) { res.status(400).json({ message: 'Невірний формат transcript' }); return }

  try {
    const client = createOpenAIClient()
    const model = getModel()
    const lang = detectTranscriptLanguage(transcript)
    const prompt = buildEvaluationPrompt(osteoporosisCase, transcript) + `\nReturn the JSON and write the summary in ${lang === 'uk' ? 'Ukrainian' : 'English'}.`
    const completion = await client.chat.completions.create({
      model,
      temperature: 0,
      messages: [{ role: 'system', content: prompt }],
    })
    const text = completion.choices[0]?.message?.content ?? ''
    res.status(200).json({ evaluation: text })
  } catch (e) {
    console.error('evaluate error:', e)
    res.status(500).json({ message: 'Помилка сервера' })
  }
}


