import type { NextApiRequest, NextApiResponse } from 'next'; // Importing types for Next.js API request and response
import { setLoggedIn } from '../store/lobbySlice'; // Importing action to set logged-in state
import { store } from '../store/store'; // Importing Redux store

// Handler function for logging out the user
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') { // Check if the request method is POST
    // Simulate user logout
    store.dispatch(setLoggedIn(false)); // Dispatch action to set logged-in state to false
    res.status(200).json({ message: 'Logged out successfully' }); // Return success message
  } else {
    res.setHeader('Allow', ['POST']); // Set allowed methods
    res.status(405).end(`Method ${req.method} Not Allowed`); // Return 405 for unsupported methods
  }
}
