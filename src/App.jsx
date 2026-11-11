
import { useState, useEffect } from 'react'

import Sidebar from './components/Sidebar'
import UploadPanel from './components/UploadPanel'
import Results from './components/Results'
import MultiClass from './components/MultiClass'
import AdvancedAnalysis from './components/AdvancedAnalysis'
import Comparison from './components/Comparison'

import {
  FileText
} from 'lucide-react'

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
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [metrics, setMetrics] = useState(null)
  const [multiclassMetrics, setMulticlassMetrics] = useState(null)
  const [comparisonMetrics, setComparisonMetrics] = useState(null)


  // Fetch all model metrics
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


  // Page titles
  const pageTitle =
    page === 'binary'
      ? 'Binary Detection'
      : page === 'multi'
        ? 'Multi-Class Detection'
        : page === 'advanced'
          ? 'Advanced Analysis'
          : 'ML vs DL Comparison'


  // CSV prediction
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
      setPage={setPage}
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
        {page === 'binary' && (

          <>

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

            {result
              ? (
                <Results
                  result={result}
                  metrics={metrics}
                  multiclassMetrics={multiclassMetrics}
                />
              )
              : <EmptyState />
            }

          </>

        )}


        {/* Multi-Class Detection */}
        {page === 'multi' && (
          <MultiClass
            multiclassMetrics={multiclassMetrics}
          />
        )}


        {/* Advanced Analysis */}
        {page === 'advanced' && (
          <AdvancedAnalysis
            multiclassMetrics={multiclassMetrics}
          />
        )}


        {/* ML vs DL Comparison */}
        {page === 'comparison' && (
          <Comparison
            comparisonMetrics={comparisonMetrics}
          />
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
