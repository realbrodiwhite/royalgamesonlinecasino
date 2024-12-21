import { createSlice, PayloadAction } from '@reduxjs/toolkit'; // Importing createSlice and PayloadAction from Redux Toolkit

// User interface representing a user in the lobby
interface User {
  username: string; // Username of the user
  balance: number; // Balance of the user
}

// LobbyState interface representing the state of the lobby
interface LobbyState {
  loggedIn: boolean; // Indicates if the user is logged in
  user?: User; // Optional user object
}

// Initial state for the lobby
const initialState: LobbyState = {
  loggedIn: false, // User is initially not logged in
};

// Creating the lobby slice
export const lobbySlice = createSlice({
  name: 'lobby', // Name of the slice
  initialState, // Initial state of the slice
  reducers: {
    // Action to set the logged-in state
    setLoggedIn: (state, action: PayloadAction<boolean>) => {
      state.loggedIn = action.payload; // Update loggedIn state
    },
    // Action to set the user object
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload; // Update user state
    },
    // Action to log out the user
    logout: (state) => {
      state.loggedIn = false; // Set loggedIn to false
      state.user = undefined; // Clear user object
    },
  },
});

// Exporting actions for use in components
export const { setLoggedIn, setUser, logout } = lobbySlice.actions;
// Exporting the reducer to be used in the store
export default lobbySlice.reducer;
