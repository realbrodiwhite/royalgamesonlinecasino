import type { NextApiRequest, NextApiResponse } from 'next';
import { setLoggedIn, setUser } from '../store/lobbySlice';
import { store } from '../store/store';

// Simulated user database
const users = [
  { username: 'user1', password: 'password1', balance: 100 },
  { username: 'user2', password: 'password2', balance: 200 },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { username, password } = req.body;

    // Check for user credentials
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      store.dispatch(setLoggedIn(true));
      store.dispatch(setUser({ username: user.username, balance: user.balance }));
      res.status(200).json({ message: 'Logged in successfully' });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}