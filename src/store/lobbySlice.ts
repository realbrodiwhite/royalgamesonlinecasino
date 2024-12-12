import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LobbyState {
  loggedIn: boolean;
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
  },
});

export const { setLoggedIn } = lobbySlice.actions;
export default lobbySlice.reducer;
