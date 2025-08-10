import { useState, useEffect } from 'react'
import { CryptoCard } from './components/CryptoCard'
import { CryptoPrice, fetchTopCryptos } from './services/cryptoApi'
import './App.css'

function App() {
  const [cryptos, setCryptos] = useState<CryptoPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  console.log('App component loaded')

  useEffect(() => {
    const loadCryptos = async () => {
      try {
        console.log('Fetching crypto data...')
        setLoading(true)
        const data = await fetchTopCryptos(12)
        console.log('Fetched cryptos:', data)
        setCryptos(data)
        setError(null)
      } catch (err) {
        setError('Failed to fetch crypto data. Please try again later.')
        console.error('Error loading cryptos:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCryptos()
    const interval = setInterval(loadCryptos, 60000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Crypto Dashboard</h1>
        <p>Real-time cryptocurrency prices with technical analysis</p>
      </header>

      {loading && (
        <div className="loading">
          <p>Loading crypto data...</p>
        </div>
      )}

      {error && (
        <div className="error">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="crypto-grid">
          {cryptos.map((crypto) => (
            <CryptoCard key={crypto.id} crypto={crypto} />
          ))}
        </div>
      )}
    </div>
  )
}

export default App
