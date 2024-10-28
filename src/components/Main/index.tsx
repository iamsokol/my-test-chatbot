import React from 'react'

import Aside from 'src/components/Aside'
import Chatbot from 'src/components/Chatbot'
import Header from 'src/components/Header'

import styles from './Main.module.scss'

const Main = () => {
  return (
    <div className={styles.container}>
      <Aside />
      <section className={styles.section}>
        <Header />
        <Chatbot />
      </section>
    </div>
  )
}

export default Main
