import React from 'react'

import styles from 'src/components/Header/Header.module.scss'
import buttons from 'src/images/buttons.svg'
import logo from 'src/images/logo.svg'
import search from 'src/images/search.svg'
import user from 'src/images/user.svg'

const Header = () => {
  return (
    <header className={styles.container}>
      <img className={styles.logo} src={logo.src} alt="logo" />
      <img className={styles.search} src={search.src} alt="search" />
      <div>
        <img className={styles.buttons} src={buttons.src} alt="buttons" />
        <img className={styles.user} src={user.src} alt="user" />
      </div>
    </header>
  )
}

export default Header
