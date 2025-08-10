import { RSI } from 'technicalindicators';
import { OHLCData } from '../services/cryptoApi';

export const calculateRSI = (data: OHLCData[], period: number = 14): number[] => {
  const closePrices = data.map(d => d.close);
  const rsiValues = RSI.calculate({
    values: closePrices,
    period: period
  });
  return rsiValues;
};

export const findSupportResistance = (data: OHLCData[], lookback: number = 20): { support: number[], resistance: number[] } => {
  const highs = data.slice(-lookback).map(d => d.high);
  const lows = data.slice(-lookback).map(d => d.low);
  
  const pricePoints = [...highs, ...lows].sort((a, b) => a - b);
  const clusters: number[][] = [];
  const threshold = (Math.max(...pricePoints) - Math.min(...pricePoints)) * 0.015;
  
  pricePoints.forEach(price => {
    let added = false;
    for (const cluster of clusters) {
      if (Math.abs(cluster[0] - price) <= threshold) {
        cluster.push(price);
        added = true;
        break;
      }
    }
    if (!added) {
      clusters.push([price]);
    }
  });
  
  const significantLevels = clusters
    .filter(cluster => cluster.length >= 2)
    .map(cluster => cluster.reduce((a, b) => a + b) / cluster.length)
    .sort((a, b) => a - b);
  
  const currentPrice = data[data.length - 1].close;
  const support = significantLevels.filter(level => level < currentPrice).slice(-2);
  const resistance = significantLevels.filter(level => level > currentPrice).slice(0, 2);
  
  return { support, resistance };
};

export const getPriceChangeColor = (change: number): string => {
  if (change > 2) return '#16a34a';
  if (change > 0) return '#22c55e';
  if (change > -2) return '#ef4444';
  return '#dc2626';
};

export const getRSIColor = (rsi: number): string => {
  if (rsi > 70) return '#dc2626';
  if (rsi < 30) return '#16a34a';
  return '#6b7280';
};