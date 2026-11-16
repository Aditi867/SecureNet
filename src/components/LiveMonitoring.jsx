
import { useState, useEffect, useCallback } from 'react'

import {
  Wifi, Play, Square, Activity, RefreshCw, PieChart,
  Database, Package, Network, ArrowUpDown, Shield,
  Download, History
} from 'lucide-react'

import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts'

const API =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const PROTOCOL_NAMES = {
  1: 'ICMP', 2: 'IGMP', 6: 'TCP', 17: 'UDP',
  41: 'IPv6', 47: 'GRE', 50: 'ESP', 58: 'ICMPv6',
  89: 'OSPF', 132: 'SCTP'
}

const COLORS = [
  '#6366f1', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#64748b'
]

function LiveMonitoring() {
  const [status, setStatus] = useState({
    running: false, total_flows: 0, flows: [], errors: []
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // SHAP explanation states
  const [explanation, setExplanation] = useState(null)
  const [explainingFlowKey, setExplainingFlowKey] = useState(null)
  const [explainError, setExplainError] = useState('')

  // Persistent detection history states
  const [historyRecords, setHistoryRecords] = useState([])
  const [historyStats, setHistoryStats] = useState({
    total: 0, normal: 0, malicious: 0, errors: 0
  })
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [exporting, setExporting] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API}/live/status`)
      if (!response.ok) throw new Error('Unable to fetch monitoring status')
      const data = await response.json()
      setStatus(data)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [])

  // Fetch persistent history and its statistics
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError('')

    try {
      const [statsResponse, historyResponse] = await Promise.all([
        fetch(`${API}/live/history/stats`),
        fetch(`${API}/live/history?limit=100`)
      ])

      if (!statsResponse.ok || !historyResponse.ok) {
        throw new Error('Unable to fetch detection history')
      }

      const stats = await statsResponse.json()
      const history = await historyResponse.json()

      setHistoryStats(stats)
      setHistoryRecords(history.records || [])
    } catch (err) {
      setHistoryError(err.message)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    fetchHistory()

    const statusInterval = setInterval(fetchStatus, 2000)
    const historyInterval = setInterval(fetchHistory, 10000)

    return () => {
      clearInterval(statusInterval)
      clearInterval(historyInterval)
    }
  }, [fetchStatus, fetchHistory])

  async function startMonitoring() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API}/live/start`, { method: 'POST' })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to start monitoring')
      }

      await fetchStatus()
      await fetchHistory()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function stopMonitoring() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API}/live/stop`, { method: 'POST' })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to stop monitoring')
      }

      await fetchStatus()
      await fetchHistory()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Download complete detection history as CSV
  async function exportHistory() {
    setExporting(true)
    setHistoryError('')

    try {
      const response = await fetch(`${API}/live/history/export`)

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.detail || 'Unable to export detection history')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = 'SecureNet_Detection_History.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()

      window.URL.revokeObjectURL(url)
    } catch (err) {
      setHistoryError(err.message)
    } finally {
      setExporting(false)
    }
  }

  const getFlowKey = (flow) => [
    flow.src_ip, flow.src_port, flow.dst_ip,
    flow.dst_port, flow.protocol, flow.duration_ms
  ].join('-')

  // Generate SHAP explanation for an individual flow
  async function explainFlow(flow) {
    const flowKey = getFlowKey(flow)

    setExplainingFlowKey(flowKey)
    setExplainError('')
    setExplanation(null)

    try {
      const response = await fetch(`${API}/live/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: flow.protocol,
          src_port: flow.src_port,
          dst_port: flow.dst_port,
          duration_ms: flow.duration_ms,
          src_to_dst_bytes: flow.src_to_dst_bytes,
          dst_to_src_bytes: flow.dst_to_src_bytes,
          src_to_dst_packets: flow.src_to_dst_packets,
          dst_to_src_packets: flow.dst_to_src_packets,
          src_to_dst_mean_packet_size: flow.src_to_dst_mean_packet_size,
          dst_to_src_mean_packet_size: flow.dst_to_src_mean_packet_size
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Unable to generate SHAP explanation')
      }

      setExplanation({ flow, data })
    } catch (err) {
      setExplainError(err.message)
    } finally {
      setExplainingFlowKey(null)
    }
  }

  const flows = status.flows || []

  const maliciousFlows = flows.filter(
    flow => flow.classification === 'Malicious'
  )
  const normalFlows = flows.filter(
    flow => flow.classification === 'Normal'
  )
  const predictionErrors = flows.filter(
    flow => flow.classification === 'Error'
  )

  const getRiskLevel = (flow) => {
    if (flow.risk_level) return flow.risk_level
    return flow.classification === 'Malicious' ? 'Review' : 'Low'
  }

  const highRiskFlows = flows.filter(
    flow => getRiskLevel(flow) === 'High'
  )
  const reviewFlows = flows.filter(
    flow => getRiskLevel(flow) === 'Review'
  )
  const lowRiskFlows = flows.filter(
    flow => getRiskLevel(flow) === 'Low'
  )

  const riskColor = (risk) => {
    if (risk === 'High') return '#ef4444'
    if (risk === 'Review') return '#f59e0b'
    return '#10b981'
  }

  const protocolStats = flows.reduce((stats, flow) => {
    const number = Number(flow.protocol)
    const name = PROTOCOL_NAMES[number] || `Protocol ${number}`

    if (!stats[name]) stats[name] = { name, flows: 0, bytes: 0 }

    stats[name].flows += 1
    stats[name].bytes += Number(flow.bytes) || 0
    return stats
  }, {})

  const totalCapturedFlows = flows.length

  const protocolData = Object.values(protocolStats)
    .map(protocol => ({
      ...protocol,
      percentage: totalCapturedFlows
        ? (protocol.flows / totalCapturedFlows) * 100
        : 0
    }))
    .sort((a, b) => b.flows - a.flows)

  const totalPackets = flows.reduce(
    (sum, flow) => sum + (Number(flow.packets) || 0), 0
  )
  const totalBytes = flows.reduce(
    (sum, flow) => sum + (Number(flow.bytes) || 0), 0
  )

  const outgoingPackets = flows.reduce(
    (sum, flow) => sum + (Number(flow.src_to_dst_packets) || 0), 0
  )
  const incomingPackets = flows.reduce(
    (sum, flow) => sum + (Number(flow.dst_to_src_packets) || 0), 0
  )
  const outgoingBytes = flows.reduce(
    (sum, flow) => sum + (Number(flow.src_to_dst_bytes) || 0), 0
  )
  const incomingBytes = flows.reduce(
    (sum, flow) => sum + (Number(flow.dst_to_src_bytes) || 0), 0
  )

  const totalData = totalBytes / 1024
  const mostFrequentProtocol =
    protocolData.length > 0 ? protocolData[0].name : 'N/A'

  const formatData = (kb) => {
    if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`
    return `${kb.toFixed(2)} KB`
  }

  const formatNumber = value =>
    (Number(value) || 0).toLocaleString('en-IN')

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp * 1000).toLocaleString('en-IN')
  }

  return (
    <div className="dashboard-content">

      {/* Page Header */}
      <div className="section-header">
        <div>
          <h2>Live Network Monitoring</h2>
          <p>
            Monitor, track and classify network traffic flowing through your Wi-Fi adapter.
          </p>
        </div>
        <button onClick={() => { fetchStatus(); fetchHistory() }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Capture Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon"><Wifi /></div>
          <h3>Capture Status</h3>
          <p>{status.running ? 'Running' : 'Stopped'}</p>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><Activity /></div>
          <h3>Captured Flows</h3>
          <p>{status.total_flows}</p>
        </div>
      </div>

      {/* Overall Traffic Summary */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon"><Package /></div>
          <h3>Total Packets</h3>
          <p>{formatNumber(totalPackets)}</p>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><Database /></div>
          <h3>Total Data Transferred</h3>
          <p>{formatData(totalData)}</p>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><Network /></div>
          <h3>Most Frequent Protocol</h3>
          <p>{mostFrequentProtocol}</p>
        </div>
      </div>

      {/* Live Threat Detection Summary */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon"><Shield /></div>
          <h3>Normal Flows</h3>
          <p>{normalFlows.length}</p>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><Shield /></div>
          <h3>Potential Threats</h3>
          <p>{maliciousFlows.length}</p>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><Activity /></div>
          <h3>Prediction Errors</h3>
          <p>{predictionErrors.length}</p>
        </div>
      </div>

      {/* Intelligent Threat Triage */}
      <div className="analysis-card">
        <h3><Shield size={19} /> Intelligent Threat Triage</h3>
        <p>
          Model-score bands help prioritize flows for review.
          These are provisional indicators, not confirmed attack probabilities.
        </p>
        <div className="metrics-grid">
          <div className="metric-card">
            <h3 style={{ color: '#ef4444' }}>High Risk</h3>
            <p>{highRiskFlows.length}</p>
            <small>Malicious score ≥ 90%</small>
          </div>
          <div className="metric-card">
            <h3 style={{ color: '#f59e0b' }}>Needs Review</h3>
            <p>{reviewFlows.length}</p>
            <small>Malicious score 50–89.99%</small>
          </div>
          <div className="metric-card">
            <h3 style={{ color: '#10b981' }}>Low Risk</h3>
            <p>{lowRiskFlows.length}</p>
            <small>Malicious score below 50%</small>
          </div>
        </div>
      </div>

      {/* Live Threat Alerts */}
      <div className="analysis-card">
        <h3><Shield size={19} /> Live Threat Alerts</h3>

        {maliciousFlows.length === 0 ? (
          <p>No potentially malicious flows detected in retained traffic.</p>
        ) : (
          <div>
            {maliciousFlows.slice(0, 10).map((flow, index) => (
              <div
                key={`${flow.src_ip}-${flow.dst_ip}-${index}`}
                style={{
                  padding: '12px', marginBottom: '10px',
                  border: '1px solid #ef4444', borderRadius: '8px'
                }}
              >
                <strong style={{ color: '#ef4444' }}>
                  Potential Malicious Traffic
                </strong>
                <p>{flow.src_ip}:{flow.src_port} → {flow.dst_ip}:{flow.dst_port}</p>
                <p>
                  Protocol: {PROTOCOL_NAMES[Number(flow.protocol)] || flow.protocol}
                </p>
                <p>
                  Risk level:{' '}
                  <strong style={{ color: riskColor(getRiskLevel(flow)) }}>
                    {getRiskLevel(flow)}
                  </strong>
                </p>
                <p>
                  Malicious model score:{' '}
                  {flow.malicious_probability != null
                    ? `${flow.malicious_probability}%` : 'N/A'}
                </p>
                <p>
                  Model confidence:{' '}
                  {flow.confidence != null ? `${flow.confidence}%` : 'N/A'}
                </p>
                <button
                  onClick={() => explainFlow(flow)}
                  disabled={explainingFlowKey === getFlowKey(flow)}
                  style={{ marginTop: '10px' }}
                >
                  {explainingFlowKey === getFlowKey(flow)
                    ? 'Generating explanation...'
                    : 'Explain with AI'}
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="monitor-note">
          Alerts represent machine-learning predictions, not independently confirmed attacks.
        </p>
      </div>

      {/* SHAP Explainable AI Panel */}
      {(explanation || explainError) && (
        <div className="analysis-card">
          <h3><Activity size={19} /> Explainable AI - SHAP Analysis</h3>
          {explainError && <p className="error-note">{explainError}</p>}

          {explanation && (
            <>
              <p>
                Flow: {explanation.flow.src_ip}:{explanation.flow.src_port}
                {' → '}
                {explanation.flow.dst_ip}:{explanation.flow.dst_port}
              </p>
              <p>
                Top five features contributing to the model's malicious-class prediction:
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>Observed Value</th>
                      <th>SHAP Impact</th>
                      <th>Contribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {explanation.data.explanation.map((item, index) => (
                      <tr key={`${item.feature}-${index}`}>
                        <td>{item.feature}</td>
                        <td>{item.value}</td>
                        <td>{item.impact}</td>
                        <td style={{
                          color: item.impact > 0 ? '#ef4444' : '#10b981',
                          fontWeight: 'bold'
                        }}>
                          {item.direction}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="monitor-note">
                SHAP values indicate each feature's contribution to the model output
                relative to its expected output. They do not establish that a flow is an actual attack.
              </p>
            </>
          )}
        </div>
      )}

      {/* Directional Traffic */}
      <div className="analysis-card">
        <h3><ArrowUpDown size={19} /> Directional Traffic Tracking</h3>
        <p>Breakdown of traffic in both directions across retained network flows.</p>
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Source to Destination</h3>
            <p>{formatNumber(outgoingPackets)} packets</p>
            <p>{formatData(outgoingBytes / 1024)}</p>
          </div>
          <div className="metric-card">
            <h3>Destination to Source</h3>
            <p>{formatNumber(incomingPackets)} packets</p>
            <p>{formatData(incomingBytes / 1024)}</p>
          </div>
        </div>
      </div>

      {/* Capture Controls */}
      <div className="analysis-card">
        <h3>Network Capture</h3>
        <p>Capture live network flows and their detailed traffic measurements.</p>
        <div className="monitor-actions">
          <button onClick={startMonitoring} disabled={status.running || loading}>
            <Play size={16} />
            {loading ? 'Please wait...' : 'Start Monitoring'}
          </button>
          <button onClick={stopMonitoring} disabled={!status.running || loading}>
            <Square size={16} /> Stop Monitoring
          </button>
        </div>
        {error && <p className="error-note">{error}</p>}
        {status.errors?.length > 0 && (
          <p className="error-note">
            {status.errors[status.errors.length - 1]}
          </p>
        )}
        <p className="monitor-note">
          Statistics represent the currently retained captured flows.
        </p>
      </div>

      {/* NEW: Persistent Detection History */}
      <div className="analysis-card">
        <div className="section-header">
          <div>
            <h3><History size={19} /> Persistent Detection History</h3>
            <p>
              Previously recorded network detections stored in the local database.
            </p>
          </div>
          <div className="monitor-actions">
            <button onClick={fetchHistory} disabled={historyLoading}>
              <RefreshCw size={16} />
              {historyLoading ? 'Loading...' : 'Refresh History'}
            </button>
            <button
              onClick={exportHistory}
              disabled={exporting || historyStats.total === 0}
            >
              <Download size={16} />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>

        {historyError && <p className="error-note">{historyError}</p>}

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon"><Database /></div>
            <h3>Total Recorded</h3>
            <p>{formatNumber(historyStats.total)}</p>
          </div>
          <div className="metric-card">
            <div className="metric-icon"><Shield /></div>
            <h3>Normal</h3>
            <p>{formatNumber(historyStats.normal)}</p>
          </div>
          <div className="metric-card">
            <div className="metric-icon"><Shield /></div>
            <h3>Predicted Malicious</h3>
            <p>{formatNumber(historyStats.malicious)}</p>
          </div>
          <div className="metric-card">
            <div className="metric-icon"><Activity /></div>
            <h3>Errors</h3>
            <p>{formatNumber(historyStats.errors)}</p>
          </div>
        </div>

        <h4>Recent Recorded Flows (Latest 100)</h4>

        {historyLoading && historyRecords.length === 0 ? (
          <p>Loading detection history...</p>
        ) : historyRecords.length === 0 ? (
          <p>No historical records available yet. Start monitoring to record flows.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>Time</th>
                  <th>Source IP</th>
                  <th>Destination IP</th>
                  <th>Protocol</th>
                  <th>Application</th>
                  <th>Classification</th>
                  <th>Risk</th>
                  <th>Malicious Score</th>
                </tr>
              </thead>
              <tbody>
                {historyRecords.map((flow, index) => (
                  <tr key={flow.history_id || index}>
                    <td>{flow.history_id || 'N/A'}</td>
                    <td>{formatDate(flow.captured_at)}</td>
                    <td>{flow.src_ip || 'N/A'}</td>
                    <td>{flow.dst_ip || 'N/A'}</td>
                    <td>
                      {PROTOCOL_NAMES[Number(flow.protocol)] ||
                        `Protocol ${flow.protocol ?? 'N/A'}`}
                    </td>
                    <td>{flow.application || 'Unknown'}</td>
                    <td>
                      <span style={{
                        color: flow.classification === 'Malicious'
                          ? '#ef4444'
                          : flow.classification === 'Normal'
                            ? '#10b981' : '#f59e0b',
                        fontWeight: 'bold'
                      }}>
                        {flow.classification || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        color: riskColor(flow.risk_level || 'Low'),
                        fontWeight: 'bold'
                      }}>
                        {flow.risk_level || 'N/A'}
                      </span>
                    </td>
                    <td>
                      {flow.malicious_probability != null
                        ? `${flow.malicious_probability}%` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="monitor-note">
          History is stored persistently in SQLite. The table displays the latest
          100 records; CSV export includes all recorded history.
          Model classifications are predictions, not independently confirmed attacks.
        </p>
      </div>

      {/* Protocol Distribution */}
      <div className="analysis-card">
        <h3><PieChart size={19} /> Protocol-wise Traffic Analysis</h3>

        {protocolData.length === 0 ? (
          <p>No protocol data available. Start monitoring to analyse traffic.</p>
        ) : (
          <>
            <p>Distribution of captured network flows by protocol.</p>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <RechartsPieChart>
                  <Pie
                    data={protocolData}
                    dataKey="flows"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={105}
                    label
                  >
                    {protocolData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
        <p className="monitor-note">
          Chart represents the currently retained captured flows.
        </p>
      </div>

      {/* Protocol Statistics */}
      <div className="analysis-card">
        <h3>Protocol Statistics</h3>

        {protocolData.length === 0 ? (
          <p>No protocol statistics available yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Protocol</th>
                  <th>Flow Count</th>
                  <th>Percentage</th>
                  <th>Total Data (Bytes)</th>
                </tr>
              </thead>
              <tbody>
                {protocolData.map(protocol => (
                  <tr key={protocol.name}>
                    <td>{protocol.name}</td>
                    <td>{protocol.flows}</td>
                    <td>{protocol.percentage.toFixed(2)}%</td>
                    <td>{formatNumber(protocol.bytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="monitor-note">
          Data volume is calculated using bidirectional bytes.
        </p>
      </div>

      {/* Detailed Flow Tracking */}
      <div className="analysis-card">
        <h3>
          <Activity size={19} />
          Detailed Network Flow Tracking and Threat Classification
        </h3>

        {flows.length === 0 ? (
          <p>No network flows captured yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Source IP</th>
                  <th>Destination IP</th>
                  <th>Protocol</th>
                  <th>Application</th>
                  <th>Classification</th>
                  <th>Risk Level</th>
                  <th>Malicious Score</th>
                  <th>Confidence</th>
                  <th>Src → Dst Packets</th>
                  <th>Dst → Src Packets</th>
                  <th>Src → Dst Bytes</th>
                  <th>Dst → Src Bytes</th>
                  <th>Src Mean Size</th>
                  <th>Dst Mean Size</th>
                  <th>SYN</th>
                  <th>ACK</th>
                  <th>FIN</th>
                  <th>RST</th>
                </tr>
              </thead>
              <tbody>
                {flows.map((flow, index) => (
                  <tr key={`${flow.src_ip}-${flow.dst_ip}-${index}`}>
                    <td>{flow.src_ip}</td>
                    <td>{flow.dst_ip}</td>
                    <td>
                      {PROTOCOL_NAMES[Number(flow.protocol)] ||
                        `Protocol ${flow.protocol}`}
                    </td>
                    <td>{flow.application || 'Unknown'}</td>
                    <td>
                      <span style={{
                        color: flow.classification === 'Malicious'
                          ? '#ef4444'
                          : flow.classification === 'Normal'
                            ? '#10b981' : '#f59e0b',
                        fontWeight: 'bold'
                      }}>
                        {flow.classification || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        color: riskColor(getRiskLevel(flow)),
                        fontWeight: 'bold'
                      }}>
                        {getRiskLevel(flow)}
                      </span>
                    </td>
                    <td>
                      {flow.malicious_probability != null
                        ? `${flow.malicious_probability}%` : 'N/A'}
                    </td>
                    <td>
                      {flow.confidence != null ? `${flow.confidence}%` : 'N/A'}
                    </td>
                    <td>{formatNumber(flow.src_to_dst_packets)}</td>
                    <td>{formatNumber(flow.dst_to_src_packets)}</td>
                    <td>{formatNumber(flow.src_to_dst_bytes)}</td>
                    <td>{formatNumber(flow.dst_to_src_bytes)}</td>
                    <td>
                      {(Number(flow.src_to_dst_mean_packet_size) || 0).toFixed(2)}
                    </td>
                    <td>
                      {(Number(flow.dst_to_src_mean_packet_size) || 0).toFixed(2)}
                    </td>
                    <td>{formatNumber(flow.syn_packets)}</td>
                    <td>{formatNumber(flow.ack_packets)}</td>
                    <td>{formatNumber(flow.fin_packets)}</td>
                    <td>{formatNumber(flow.rst_packets)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="monitor-note">
          Direction is relative to the flow's source and destination endpoints.
          TCP flags are packet counts, not threat indicators by themselves.
          Classification and confidence are generated by the live machine-learning model.
          Risk levels are provisional score bands used to prioritize manual review.
        </p>
      </div>

    </div>
  )
}

export default LiveMonitoring
