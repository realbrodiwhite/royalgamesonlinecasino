'use client'; // Indicates that this component is a client component

import { Provider } from 'react-redux'; // Importing Provider from react-redux for state management
import { store } from '../store/store'; // Importing the Redux store

// Providers component to wrap children with Redux Provider
export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>; // Providing the Redux store to children components
}
