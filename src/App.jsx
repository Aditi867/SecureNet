
import { useState } from 'react'

import Sidebar from './components/Sidebar'
import UploadPanel from './components/UploadPanel'
import Results from './components/Results'

import {
  ChartNoAxesCombined,
  FileText,
  ArrowUpRight
} from 'lucide-react'


// Backend URL
const API =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'


// Illustrative preview data
const demo = {
  total_records: 1000,
  attack_count: 350,
  benign_count: 650,
  accuracy: null,
  is_demo: true,
  predictions: [
    { prediction: 'Attack', probability: 0.97 },
    { prediction: 'Benign', probability: 0.91 }
  ],
  confusion_matrix: null,
  classification_report: null
}


// Empty state component
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


// Main application
export default function App() {

  const [page, setPage] = useState('binary')
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')


  // Page title
  const pageTitle =
    page === 'binary'
      ? 'Binary Detection'
      : page === 'multi'
        ? 'Multi-class Detection'
        : 'Advanced Analysis'


  // Analyze uploaded CSV
  async function analyze() {

    if (!file) return

    setBusy(true)
    setError('')

    try {

      const form = new FormData()
      form.append('file', file)

      const endpoint =
        page === 'multi'
          ? '/predict/multiclass'
          : '/predict/binary'

      const response = await fetch(
        `${API}${endpoint}`,
        {
          method: 'POST',
          body: form
        }
      )

      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status}. Check that your friend's API is running.`
        )
      }

      const data = await response.json()

      setResult({
        ...data,
        is_demo: false
      })

    } catch (e) {

      // Clearly labelled preview if backend is unavailable
      setResult({ ...demo })

      setError(
        `${e.message} Showing illustrative preview data instead.`
      )

    } finally {

      setBusy(false)

    }
  }


  return (

    <div className="app-shell">

      {/* Sidebar */}
      <Sidebar
        page={page}
        setPage={(newPage) => {
          setPage(newPage)
          setResult(null)
          setError('')
        }}
      />


      {/* Main content */}
      <main className="main">

        {/* Header */}
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


        {/* Page content */}
        {page !== 'binary' ? (

          <div className="coming panel">

            <div className="empty-icon">
              <ChartNoAxesCombined />
            </div>

            <h2>{pageTitle}</h2>

            <p>
              This module will be enabled after the multiclass
              and advanced analysis models are implemented.
            </p>

            <button
              className="text-btn"
              onClick={() => setPage('binary')}
            >
              Return to Binary Detection
              <ArrowUpRight size={15} />
            </button>

          </div>

        ) : (

          <>

            {/* CSV upload */}
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


            {/* Error message */}
            {error && (
              <div className="error-note">
                {error}
              </div>
            )}


            {/* Results */}
            {result
              ? <Results result={result} />
              : <EmptyState />
            }

          </>

        )}


        {/* Footer */}
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
