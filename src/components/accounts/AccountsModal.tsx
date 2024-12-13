'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { socket } from '../../utils/socket';
import { setLoggedIn, setUser } from '../../store/lobbySlice';
import styles from './AccountsModal.module.css';

interface AccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LoginResponse {
  status: 'logged-in' | 'error';
  key?: string;
  username?: string;
  balance?: number;
  message?: string;
}

type ModalView = 'main' | 'login' | 'register' | 'account';

const AccountsModal = ({ isOpen, onClose }: AccountsModalProps) => {
  const dispatch = useDispatch();
  const [currentView, setCurrentView] = useState<ModalView>('main');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGuestLogin = () => {
    setIsLoading(true);
    setError(null);
    socket.emit('login', { key: null });

    socket.once('login', (data: LoginResponse) => {
      setIsLoading(false);
      if (data.status === 'logged-in' && data.username && data.balance) {
        dispatch(setLoggedIn(true));
        dispatch(setUser({
          username: data.username,
          balance: data.balance
        }));
        if (data.key) {
          localStorage.setItem('key', data.key);
        }
        onClose();
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    });
  };

  const renderMainView = () => (
    <>
      <h2>Welcome to SLOT ICON</h2>
      <p>Please choose how you would like to continue:</p>
      
      <div className={styles.buttons}>
        <button 
          onClick={handleGuestLogin}
          disabled={isLoading}
          className={styles.button}
        >
          {isLoading ? 'Loading...' : 'Play as Guest'}
        </button>
        
        <button 
          onClick={() => setCurrentView('login')}
          className={`${styles.button} ${styles.secondary}`}
        >
          Login
        </button>
        
        <button 
          onClick={() => setCurrentView('register')}
          className={`${styles.button} ${styles.secondary}`}
        >
          Register
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </>
  );

  const renderLoginView = () => (
    <>
      <h2>Login</h2>
      <p>Login functionality coming soon!</p>
      <div className={styles.buttons}>
        <button 
          onClick={() => setCurrentView('main')}
          className={`${styles.button} ${styles.secondary}`}
        >
          Back
        </button>
      </div>
    </>
  );

  const renderRegisterView = () => (
    <>
      <h2>Register</h2>
      <p>Registration functionality coming soon!</p>
      <div className={styles.buttons}>
        <button 
          onClick={() => setCurrentView('main')}
          className={`${styles.button} ${styles.secondary}`}
        >
          Back
        </button>
      </div>
    </>
  );

  const renderAccountView = () => (
    <>
      <h2>My Account</h2>
      <p>Account management coming soon!</p>
      <div className={styles.buttons}>
        <button 
          onClick={() => setCurrentView('main')}
          className={`${styles.button} ${styles.secondary}`}
        >
          Back
        </button>
      </div>
    </>
  );

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {currentView === 'main' && renderMainView()}
        {currentView === 'login' && renderLoginView()}
        {currentView === 'register' && renderRegisterView()}
        {currentView === 'account' && renderAccountView()}
      </div>
    </div>
  );
};

export default AccountsModal;