import type { NextApiRequest, NextApiResponse } from 'next';
import { setLoggedIn } from '../store/lobbySlice';
import { store } from '../store/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Simulate user login
    store.dispatch(setLoggedIn(true));
    res.status(200).json({ message: 'Logged in successfully' });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
