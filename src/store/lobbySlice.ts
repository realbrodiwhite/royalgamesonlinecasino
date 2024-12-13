import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  username: string;
  balance: number;
}

interface LobbyState {
  loggedIn: boolean;
  user?: User;
}

const initialState: LobbyState = {
  loggedIn: false,
};

export const lobbySlice = createSlice({
  name: 'lobby',
  initialState,
  reducers: {
    setLoggedIn: (state, action: PayloadAction<boolean>) => {
      state.loggedIn = action.payload;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.loggedIn = false;
      state.user = undefined;
    },
  },
});

export const { setLoggedIn, setUser, logout } = lobbySlice.actions;
export default lobbySlice.reducer;
