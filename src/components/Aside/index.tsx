import React from 'react'

import styles from 'src/components/Aside/Aside.module.scss'
import board from 'src/images/board.svg'
import logo from 'src/images/logo.svg'

const Aside = () => {
  return (
    <aside className={styles.container}>
      <div>
        <a href="https://klatsed.com/">
          <img className={styles.logo} src={logo.src} alt="logo" />
        </a>
        <menu className={styles.menu}>
          <p>Home</p>
          <p>Cases</p>
          <p>AI Patient</p>
        </menu>
      </div>
      <div className={styles.board}>
        <img src={board.src} alt="board" />
      </div>
    </aside>
  )
}

export default Aside
