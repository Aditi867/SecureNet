
import {
  Shield,
  Activity,
  TriangleAlert,
  ChartNoAxesCombined,
  ShieldCheck,
  Download
} from 'lucide-react'

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts'

export default function Results({ result, metrics }) {

  // Threat distribution
  const chartData = [
    { name: 'Attack', value: result.attack_count || 0 },
    { name: 'Benign', value: result.benign_count || 0 }
  ]

  // Binary evaluation metrics
  const performance = [
    { name: 'Accuracy', value: metrics?.accuracy },
    { name: 'Precision', value: metrics?.precision },
    { name: 'Recall', value: metrics?.recall },
    { name: 'F1-score', value: metrics?.f1_score }
  ]

  // Binary confusion matrix
  const binaryMatrix = metrics?.confusion_matrix

  const total = result.total_records || 0

  const testRecords = binaryMatrix
    ? binaryMatrix.flat().reduce((sum, value) => sum + value, 0)
    : 0

  return (
    <div className="results">

      {/* PDF download */}
      <div className="pdf-actions">
        <button
          className="pdf-btn"
          onClick={() => window.print()}
        >
          <Download size={16} />
          Download PDF Report
        </button>
      </div>

      {/* Analysis summary */}
      <div className="result-banner">
        <div>
          <span className="eyebrow">ANALYSIS COMPLETED</span>
          <div className="accuracy">
            {total.toLocaleString()}
          </div>
          <p>Total network traffic records analyzed</p>
        </div>
        <ShieldCheck size={39} />
      </div>

      {/* Binary model performance */}
      <section className="panel">

        <div className="panel-title">
          <ChartNoAxesCombined size={18} />
          Binary model performance
        </div>

        <div className="two-col">
          {performance.map((item) => (
            <div className="metric-card" key={item.name}>
              <span>{item.name}</span>
              <strong>
                {item.value == null
                  ? 'Loading...'
                  : `${(item.value * 100).toFixed(2)}%`}
              </strong>
            </div>
          ))}
        </div>

        <p className="report-placeholder">
          Evaluation metrics calculated on the labelled
          binary test dataset during model training.
        </p>

      </section>

      {/* Threat distribution */}
      <section className="panel">

        <div className="panel-title">
          <Activity size={18} />
          Threat distribution
        </div>

        <div className="chart-wrap">

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={3}
              >
                <Cell fill="#ff536b" />
                <Cell fill="#37d6a0" />
              </Pie>

              <Tooltip
                contentStyle={{
                  background: '#12243a',
                  border: '1px solid #29415e',
                  borderRadius: 10
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="chart-center">
            <strong>{total.toLocaleString()}</strong>
            <span>Records</span>
          </div>

        </div>

        <div className="legend">

          <span>
            <i className="red" />
            Attack
            <b>{(result.attack_count || 0).toLocaleString()}</b>
          </span>

          <span>
            <i className="green" />
            Benign
            <b>{(result.benign_count || 0).toLocaleString()}</b>
          </span>

        </div>

      </section>

      {/* Binary confusion matrix */}
      <section className="panel">

        <div className="panel-title">
          <Shield size={18} />
          Binary confusion matrix
        </div>

        {binaryMatrix ? (

          <div className="matrix">

            <div className="matrix-label">
              Predicted →
            </div>

            <div className="matrix-grid">
              <span>{binaryMatrix[0][0].toLocaleString()}</span>
              <span>{binaryMatrix[0][1].toLocaleString()}</span>
              <span>{binaryMatrix[1][0].toLocaleString()}</span>
              <span>{binaryMatrix[1][1].toLocaleString()}</span>
            </div>

            <div className="matrix-caption">
              Rows: actual class · Columns: predicted class
            </div>

            <div className="matrix-caption">
              Class 0: Benign · Class 1: Attack
            </div>

            <div className="matrix-caption">
              Labelled test records: {testRecords.toLocaleString()}
            </div>

          </div>

        ) : (
          <div className="unavailable">
            <TriangleAlert size={25} />
            <strong>Metrics unavailable</strong>
            <span>Waiting for backend evaluation metrics.</span>
          </div>
        )}

      </section>

      {/* Model information */}
      <section className="panel">

        <div className="panel-title">
          <ShieldCheck size={18} />
          Model information
        </div>

        <div className="report-placeholder">
          SecureNet uses a trained binary classification model
          to analyse network traffic and distinguish between
          benign and malicious activity. Model performance is
          evaluated using a separate labelled test dataset.
        </div>

      </section>

    </div>
  )
}
