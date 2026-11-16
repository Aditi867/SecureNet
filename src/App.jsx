
import { useState, useEffect } from 'react'

import LiveMonitoring from './components/LiveMonitoring'
import Sidebar from './components/Sidebar'
import UploadPanel from './components/UploadPanel'
import Results from './components/Results'
import MultiClass from './components/MultiClass'
import AdvancedAnalysis from './components/AdvancedAnalysis'
import Comparison from './components/Comparison'

import { FileText } from 'lucide-react'

const API =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <FileText size={25} />
      </div>
      <h3>Your analysis will appear here</h3>
      <p>
        Upload a network traffic CSV to view detection results,
        threat distribution and model metrics.
      </p>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('binary')

  // Keep track of pages visited so they are not unmounted.
  const [visitedPages, setVisitedPages] = useState(['binary'])

  const navigateToPage = (nextPage) => {
    setPage(nextPage)

    setVisitedPages((previous) =>
      previous.includes(nextPage)
        ? previous
        : [...previous, nextPage]
    )
  }

  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [metrics, setMetrics] = useState(null)
  const [multiclassMetrics, setMulticlassMetrics] = useState(null)
  const [comparisonMetrics, setComparisonMetrics] = useState(null)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const binaryResponse = await fetch(`${API}/metrics`)
        if (!binaryResponse.ok) {
          throw new Error('Unable to fetch binary metrics')
        }
        setMetrics(await binaryResponse.json())

        const multiclassResponse = await fetch(
          `${API}/multiclass-metrics`
        )
        if (!multiclassResponse.ok) {
          throw new Error('Unable to fetch multiclass metrics')
        }
        setMulticlassMetrics(await multiclassResponse.json())

        const comparisonResponse = await fetch(
          `${API}/comparison-metrics`
        )
        if (!comparisonResponse.ok) {
          throw new Error('Unable to fetch comparison metrics')
        }
        setComparisonMetrics(await comparisonResponse.json())
      } catch (error) {
        console.error('Metrics error:', error)
      }
    }

    fetchMetrics()
  }, [])

  const pageTitle =
    page === 'binary'
      ? 'Binary Detection'
      : page === 'multi'
        ? 'Multi-Class Detection'
        : page === 'advanced'
          ? 'Advanced Analysis'
          : page === 'comparison'
            ? 'ML vs DL Comparison'
            : 'Live Monitoring'

  async function analyze() {
    if (!file) return

    setBusy(true)
    setError('')
    setResult(null)

    try {
      const form = new FormData()
      form.append('file', file)

      const response = await fetch(`${API}/predict`, {
        method: 'POST',
        body: form
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.detail || `Backend error: ${response.status}`
        )
      }

      const data = await response.json()

      setResult({
        ...data,
        is_demo: false
      })
    } catch (e) {
      console.error('Prediction error:', e)
      setError(
        e.message || 'Unable to connect to SecureNet backend.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-shell">

      <Sidebar
        page={page}
        setPage={navigateToPage}
      />

      <main className="main">

        <header className="topbar">
          <div>
            <div className="breadcrumb">
              SECURENET <span>/</span>
              WORKSPACE <span>/</span>
              {pageTitle.toUpperCase()}
            </div>

            <h1>
              {page === 'binary'
                ? 'IoT Network Intrusion Detection'
                : pageTitle}
            </h1>

            <p>
              {page === 'comparison'
                ? 'Performance comparison of Machine Learning and Deep Learning models'
                : 'Network threat detection and analysis'}
            </p>
          </div>

          <div className="top-status">
            <span className="live-dot" />
            SYSTEM READY
          </div>
        </header>

        {/* Binary Detection */}
        {visitedPages.includes('binary') && (
          <div style={{ display: page === 'binary' ? 'block' : 'none' }}>
            <UploadPanel
              file={file}
              onFile={(f) => {
                setFile(f)
                setResult(null)
                setError('')
              }}
              onAnalyze={analyze}
              busy={busy}
            />

            {error && (
              <div className="error-note">
                {error}
              </div>
            )}

            {result ? (
              <Results
                result={result}
                metrics={metrics}
                multiclassMetrics={multiclassMetrics}
              />
            ) : (
              <EmptyState />
            )}
          </div>
        )}

        {/* Multi-Class Detection */}
        {visitedPages.includes('multi') && (
          <div style={{ display: page === 'multi' ? 'block' : 'none' }}>
            <MultiClass
              multiclassMetrics={multiclassMetrics}
            />
          </div>
        )}

        {/* Advanced Analysis */}
        {visitedPages.includes('advanced') && (
          <div style={{ display: page === 'advanced' ? 'block' : 'none' }}>
            <AdvancedAnalysis
              multiclassMetrics={multiclassMetrics}
            />
          </div>
        )}

        {/* ML vs DL Comparison */}
        {visitedPages.includes('comparison') && (
          <div style={{ display: page === 'comparison' ? 'block' : 'none' }}>
            <Comparison
              comparisonMetrics={comparisonMetrics}
            />
          </div>
        )}

        {/* Live Monitoring */}
        {visitedPages.includes('live') && (
          <div style={{ display: page === 'live' ? 'block' : 'none' }}>
            <LiveMonitoring />
          </div>
        )}

        <footer>
          SecureNet · Academic project prototype
          <span>
            Deep learning-based network intrusion detection
          </span>
        </footer>

      </main>
    </div>
  )
}
