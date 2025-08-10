import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { CryptoPrice, OHLCData, fetchOHLCData } from '../services/cryptoApi';
import { calculateRSI, findSupportResistance, getPriceChangeColor, getRSIColor } from '../utils/technicalAnalysis';
import './CryptoCard.css';

interface CryptoCardProps {
  crypto: CryptoPrice;
}

export const CryptoCard: React.FC<CryptoCardProps> = ({ crypto }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [ohlcData, setOhlcData] = useState<OHLCData[]>([]);
  const [rsi, setRsi] = useState<number | null>(null);
  const [supportResistance, setSupportResistance] = useState<{ support: number[], resistance: number[] }>({ support: [], resistance: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchOHLCData(crypto.id, 7);
        setOhlcData(data);
        
        const rsiValues = calculateRSI(data);
        if (rsiValues.length > 0) {
          setRsi(rsiValues[rsiValues.length - 1]);
        }
        
        const levels = findSupportResistance(data);
        setSupportResistance(levels);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading OHLC data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [crypto.id]);

  useEffect(() => {
    if (!chartContainerRef.current || loading || ohlcData.length === 0) return;

    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 200,
      layout: {
        background: { color: '#1a1a1a' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#2a2a2a' },
        horzLines: { color: '#2a2a2a' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    candlestickSeriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const fourHourData = ohlcData.filter((_, index) => index % 6 === 0);
    const candlestickData: CandlestickData[] = fourHourData.map(d => ({
      time: d.time as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeriesRef.current.setData(candlestickData);

    supportResistance.support.forEach(level => {
      chartRef.current?.addBaselineSeries({
        baseValue: { type: 'price', price: level },
        topLineColor: 'rgba(34, 197, 94, 0.5)',
        topFillColor1: 'rgba(34, 197, 94, 0.1)',
        topFillColor2: 'rgba(34, 197, 94, 0.0)',
        title: 'Support',
      });
    });

    supportResistance.resistance.forEach(level => {
      chartRef.current?.addBaselineSeries({
        baseValue: { type: 'price', price: level },
        topLineColor: 'rgba(239, 68, 68, 0.5)',
        topFillColor1: 'rgba(239, 68, 68, 0.1)',
        topFillColor2: 'rgba(239, 68, 68, 0.0)',
        title: 'Resistance',
      });
    });

    chartRef.current.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartRef.current?.remove();
    };
  }, [ohlcData, loading, supportResistance]);

  const priceChangeColor = getPriceChangeColor(crypto.price_change_percentage_24h);
  const rsiColor = rsi ? getRSIColor(rsi) : '#6b7280';

  return (
    <div className="crypto-card" style={{ borderColor: priceChangeColor }}>
      <div className="crypto-header">
        <div className="crypto-info">
          <h3>{crypto.name}</h3>
          <span className="crypto-symbol">{crypto.symbol.toUpperCase()}</span>
        </div>
        <div className="crypto-price">
          <span className="price">${crypto.current_price.toLocaleString()}</span>
          <span className="price-change" style={{ color: priceChangeColor }}>
            {crypto.price_change_percentage_24h > 0 ? '+' : ''}
            {crypto.price_change_percentage_24h.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="crypto-stats">
        <div className="stat">
          <span className="stat-label">1h Change</span>
          <span className="stat-value" style={{ color: getPriceChangeColor(crypto.price_change_percentage_1h) }}>
            {crypto.price_change_percentage_1h > 0 ? '+' : ''}
            {crypto.price_change_percentage_1h.toFixed(2)}%
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">24h High/Low</span>
          <span className="stat-value">
            ${crypto.high_24h.toFixed(2)} / ${crypto.low_24h.toFixed(2)}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">RSI (14)</span>
          <span className="stat-value" style={{ color: rsiColor }}>
            {rsi ? rsi.toFixed(2) : 'N/A'}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Volume 24h</span>
          <span className="stat-value">
            ${(crypto.volume_24h / 1000000).toFixed(2)}M
          </span>
        </div>
      </div>

      <div className="chart-container" ref={chartContainerRef}></div>

      {supportResistance.support.length > 0 || supportResistance.resistance.length > 0 ? (
        <div className="support-resistance">
          {supportResistance.resistance.length > 0 && (
            <div className="levels">
              <span className="level-label">Resistance:</span>
              {supportResistance.resistance.map((level, i) => (
                <span key={i} className="level-value resistance">
                  ${level.toFixed(2)}
                </span>
              ))}
            </div>
          )}
          {supportResistance.support.length > 0 && (
            <div className="levels">
              <span className="level-label">Support:</span>
              {supportResistance.support.map((level, i) => (
                <span key={i} className="level-value support">
                  ${level.toFixed(2)}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};