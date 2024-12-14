import { lobbySlice, setLoggedIn, setUser, logout } from '../store/lobbySlice';

describe('Lobby Slice', () => {
  const initialState = {
    loggedIn: false,
  };

  it('should handle initial state', () => {
    expect(lobbySlice.reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setLoggedIn', () => {
    const actual = lobbySlice.reducer(initialState, setLoggedIn(true));
    expect(actual.loggedIn).toEqual(true);
  });

  it('should handle setUser', () => {
    const user = { username: 'testuser', balance: 1000 };
    const actual = lobbySlice.reducer(initialState, setUser(user));
    expect(actual.user).toEqual(user);
  });

  it('should handle logout', () => {
    const loggedInState = {
      loggedIn: true,
      user: { username: 'testuser', balance: 1000 }
    };
    const actual = lobbySlice.reducer(loggedInState, logout());
    expect(actual).toEqual({
      loggedIn: false,
      user: undefined
    });
  });
});
