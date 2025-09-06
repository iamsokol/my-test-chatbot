import React, { KeyboardEvent, useEffect, useRef, useState } from 'react'

import send from 'src/images/send.svg'
import voice from 'src/images/voice.svg'

import styles from './Chatbot.module.scss'

interface Message {
  sender: 'user' | 'bot'
  text: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluation, setEvaluation] = useState<string>('')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: ChatMessage = { role: 'user', content: input.trim() }
    const updatedChatHistory = [...chatHistory, userMessage]

    setMessages([...messages, { sender: 'user', text: input.trim() }])
    setInput('')
    setChatHistory(updatedChatHistory)
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: updatedChatHistory }),
      })

      if (!response.body) throw new Error('No stream body')

      let botText = ''

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let gotFirstDelta = false
      let lastFlush = 0
      let burstCount = 1
      let lastSplitIndex = 0
      const allowSplit = Math.random() < 0.4

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const parts = chunk.split('\n\n')
        for (const part of parts) {
          if (!part.startsWith('data: ')) continue
          const payload = part.slice(6)
          if (payload === '[DONE]') {
            setIsLoading(false)
            break
          }
          if (payload === '[ERROR]') {
            setIsLoading(false)
            throw new Error('Stream error')
          }
          botText += payload
          if (!gotFirstDelta) {
            gotFirstDelta = true
            setIsLoading(false)
            setMessages(prev => [...prev, { sender: 'bot', text: '' }])
          }
          const endsSentence = /[\.!?…]\s?$/.test(botText)
          if (
            allowSplit &&
            endsSentence &&
            burstCount < 2 &&
            botText.length - lastSplitIndex > 120
          ) {
            const splitIndex = botText.length
            setMessages(prev => {
              const next = [...prev]
              next[next.length - 1] = { sender: 'bot', text: botText.slice(0, splitIndex) }
              return next
            })
            await new Promise(resolve => setTimeout(resolve, 300))
            setMessages(prev => [...prev, { sender: 'bot', text: '' }])
            burstCount += 1
            lastSplitIndex = splitIndex
          }
          const now = Date.now()
          if (now - lastFlush > 60) {
            lastFlush = now
            setMessages(prev => {
              const next = [...prev]
              next[next.length - 1] = { sender: 'bot', text: botText.slice(lastSplitIndex) }
              return next
            })
          }
        }
      }

      if (gotFirstDelta) {
        setMessages(prev => {
          const next = [...prev]
          const remaining = botText.slice(lastSplitIndex)
          if (remaining && remaining.trim().length > 0) {
            next[next.length - 1] = { sender: 'bot', text: remaining }
          } else {
            const last = next[next.length - 1]
            if (last && last.sender === 'bot' && (!last.text || last.text.trim() === '')) {
              next.pop()
            }
          }
          return next
        })
      }
      setChatHistory(prev => [...prev, { role: 'assistant', content: botText }])
    } catch (error) {
      console.error('Something went wrong', error)
      setMessages(prevMessages => [
        ...prevMessages,
        { sender: 'bot', text: 'Something went wrong' },
      ])
      setIsLoading(false)
    }
  }

  const finishSession = async () => {
    if (isEvaluating || chatHistory.length === 0) return
    setIsEvaluating(true)
    setEvaluation('')
    try {
      const resp = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: chatHistory }),
      })
      const data = await resp.json()
      let summary = ''
      try {
        const obj = JSON.parse(data.evaluation)
        const scores = obj.scores || {}
        summary = `Feedback: ${obj.summary || ''}\nScores (1-5): HPI ${scores.hpi ?? '-'}, PMH ${
          scores.pmh ?? '-'
        }, PSH ${scores.psh ?? '-'}, SH ${scores.sh ?? '-'}, FH ${scores.fh ?? '-'}, Meds ${
          scores.meds ?? '-'
        }, Empathy ${scores.empathy ?? '-'}, Structure ${scores.structure ?? '-'}, Language ${
          scores.language ?? '-'
        }`
      } catch {
        summary = String(data.evaluation || '')
      }
      setEvaluation(summary)
    } catch (e) {
      setEvaluation('Evaluation error')
    } finally {
      setIsEvaluating(false)
    }
  }

  const startNewDialog = () => {
    setMessages([])
    setChatHistory([])
    setInput('')
    setEvaluation('')
    setIsEvaluating(false)
    setIsLoading(false)
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage()
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.head}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title} style={{ flex: 1 }}>
            AI Patient
          </h1>
          {evaluation ? (
            <button
              className={styles.headButton}
              onClick={startNewDialog}
              style={{ marginLeft: 'auto' }}
            >
              New dialog
            </button>
          ) : (
            chatHistory.length > 0 && (
              <button className={styles.headButton} onClick={finishSession} disabled={isEvaluating}>
                {isEvaluating ? 'Evaluating…' : 'Finish'}
              </button>
            )
          )}
        </div>
        <p className={styles.description}>
          Use the "AI Patient" simulation to assess your skills. Assume the role of a doctor and
          conduct a thorough yet concise patient survey.
        </p>
      </div>
      <div className={styles.dialog}>
        {evaluation ? (
          <div className={styles.evaluationBox}>{evaluation}</div>
        ) : (
          <div className={styles.dialogWrapper}>
            <div className={styles.messages}>
              {messages.map((msg, index) => (
                <div key={index} className={msg.sender === 'user' ? styles.user : styles.bot}>
                  <div className={styles.message}>
                    <p>{msg.text}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className={styles.bot}>
                  <div className={styles.loaderElement}>
                    <span className={styles.loader}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        <div className={styles.panel}>
          <input
            type="text"
            className={styles.input}
            placeholder="Write a massage for AI patient..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button className={styles.button} onClick={sendMessage}>
            <img src={send.src} alt="send" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chatbot
