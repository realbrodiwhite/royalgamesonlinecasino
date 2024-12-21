import axios from 'axios';

export const fetchGameData = async (gameId: string) => {
  try {
    const response = await axios.get(`/api/games/${gameId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching game data:', error);
    throw new Error('Failed to fetch game data');
  }
};
