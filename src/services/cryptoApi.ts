import axios from 'axios';

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h: number;
  high_24h: number;
  low_24h: number;
  market_cap: number;
  volume_24h: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

export interface OHLCData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const BASE_URL = 'https://api.coingecko.com/api/v3';

export const fetchTopCryptos = async (limit: number = 20): Promise<CryptoPrice[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: limit,
        page: 1,
        sparkline: true,
        price_change_percentage: '1h,24h,7d'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    throw error;
  }
};

export const fetchOHLCData = async (coinId: string, days: number = 30): Promise<OHLCData[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/coins/${coinId}/ohlc`, {
      params: {
        vs_currency: 'usd',
        days: days
      }
    });
    return response.data.map(([time, open, high, low, close]: number[]) => ({
      time: time / 1000,
      open,
      high,
      low,
      close,
      volume: 0
    }));
  } catch (error) {
    console.error('Error fetching OHLC data:', error);
    throw error;
  }
};