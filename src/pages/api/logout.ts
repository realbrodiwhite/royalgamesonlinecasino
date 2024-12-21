import type { NextApiRequest, NextApiResponse } from 'next'; // Importing types for Next.js API request and response
import { setLoggedIn } from '../store/lobbySlice'; // Importing action to set logged-in state
import { store } from '../store/store'; // Importing Redux store
import { withRateLimit } from '../../middleware/rateLimit';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Simulate user logout
    store.dispatch(setLoggedIn(false)); // Dispatch action to set logged-in state to false
    res.status(200).json({ message: 'Logged out successfully' }); // Return success message
  } else {
    res.setHeader('Allow', ['POST']); // Set allowed methods
    res.status(405).end(`Method ${req.method} Not Allowed`); // Return 405 for unsupported methods
  }
}


// Apply rate limiting to the logout endpoint
export default withRateLimit(handler, {
  limit: 10, // 10 attempts
  windowSeconds: 60 * 5 // 5 minute window
});
