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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: updatedChatHistory }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessages(prevMessages => [...prevMessages, { sender: 'bot', text: data.reply }])
        setChatHistory(prevHistory => [...prevHistory, { role: 'assistant', content: data.reply }])
      } else {
        setMessages(prevMessages => [
          ...prevMessages,
          { sender: 'bot', text: 'Виникла помилка при отриманні відповіді.' },
        ])
      }
    } catch (error) {
      console.error('Помилка при відправці повідомлення:', error)
      setMessages(prevMessages => [
        ...prevMessages,
        { sender: 'bot', text: 'Виникла помилка при відправленні повідомлення.' },
      ])
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage()
    }
  }

  console.log('send, send', send)

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
          <button className={styles.button}>
            <img src={voice.src} alt="voice" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chatbot
