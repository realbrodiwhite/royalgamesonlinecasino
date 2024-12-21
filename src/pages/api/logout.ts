import type { NextApiRequest, NextApiResponse } from 'next';
import { setLoggedIn } from '../store/lobbySlice';
import { store } from '../store/store';
import { withRateLimit } from '../../middleware/rateLimit';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Simulate user logout
    store.dispatch(setLoggedIn(false));
    res.status(200).json({ message: 'Logged out successfully' });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Apply rate limiting to the logout endpoint
export default withRateLimit(handler, {
  limit: 10, // 10 attempts
  windowSeconds: 60 * 5 // 5 minute window
});
