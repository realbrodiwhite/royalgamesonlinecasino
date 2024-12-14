'use client';

import { useSelector } from 'react-redux';
import { RootState } from '/store/store';
import styles from './Header.module.css';

const Header = () => {
  const loggedIn = useSelector((state: RootState) => state.lobby.loggedIn);

  return (
    <div className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoHighlight}>SLOT</span>
        <span>ICON</span>
      </div>

      <div className={`${styles.userInfo} ${!loggedIn ? styles.hidden : ''}`}>
        <div className={styles.balance}>
          <span className={styles.balanceLabel}>Balance:</span>
          <span>1000</span>
        </div>
      </div>
    </div>
  );
}

export default Header;
