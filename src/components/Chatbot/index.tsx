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
      // попередньо додати порожнє бот-повідомлення, яке будемо оновлювати
      setMessages(prev => [...prev, { sender: 'bot', text: '' }])

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

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
          setMessages(prev => {
            const next = [...prev]
            // останнє повідомлення — бот; оновлюємо його текст
            next[next.length - 1] = { sender: 'bot', text: botText }
            return next
          })
        }
      }
      setChatHistory(prev => [...prev, { role: 'assistant', content: botText }])
    } catch (error) {
      console.error('Something went wrong', error)
      setMessages(prevMessages => [
        ...prevMessages,
        { sender: 'bot', text: 'Something went wrong' },
      ])
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage()
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.head}>
        <h1 className={styles.title}>AI Patient </h1>
        <p className={styles.description}>
          Use the "AI Patient" simulation to assess your skills. Assume the role of a doctor and
          conduct a thorough yet concise patient survey.
        </p>
      </div>
      <div className={styles.dialog}>
        <div className={styles.dialogWrapper}>
          <div className={styles.messages}>
            {messages.map((msg, index) => (
              <div className={msg.sender === 'user' ? styles.user : styles.bot}>
                <div key={index} className={styles.message}>
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
