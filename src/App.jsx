
import { useState, useEffect } from 'react'

import Sidebar from './components/Sidebar'
import UploadPanel from './components/UploadPanel'
import Results from './components/Results'
import MultiClass from './components/MultiClass'
import AdvancedAnalysis from './components/AdvancedAnalysis'

import {
  FileText,
  ArrowUpRight
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
        : 'Advanced Analysis'


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
        setPage={(newPage) => {
          setPage(newPage)
          setResult(null)
          setError('')
        }}
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
              Real-time network threat detection and analysis
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
