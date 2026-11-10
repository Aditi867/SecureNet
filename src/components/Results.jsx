
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


export default function Results({
  result,
  metrics,
  multiclassMetrics
}) {

  const classNames = [
    'Analysis',
    'Backdoor',
    'Benign',
    'DoS',
    'Exploits',
    'Fuzzers',
    'Generic',
    'Reconnaissance',
    'Shellcode',
    'Worms'
  ]

  // Threat distribution
  const chartData = [
    { name: 'Attack', value: result.attack_count || 0 },
    { name: 'Benign', value: result.benign_count || 0 }
  ]

  // Attack categories
  const categories = Object.entries(
    result.attack_categories || {}
  ).filter(([name]) => name !== 'Benign')

  // Binary evaluation metrics
  const performance = [
    { name: 'Accuracy', value: metrics?.accuracy },
    { name: 'Precision', value: metrics?.precision },
    { name: 'Recall', value: metrics?.recall },
    { name: 'F1-score', value: metrics?.f1_score }
  ]

  // Multiclass evaluation report
  const classificationReport =
    multiclassMetrics?.classification_report || {}

  const multiclassPerformance = classNames.map((name) => ({
    name,
    ...classificationReport[name]
  })).filter((item) => item.precision !== undefined)

  const macroAverage = classificationReport['macro avg']
  const weightedAverage = classificationReport['weighted avg']

  const multiclassAccuracy = classificationReport.accuracy

  // Confusion matrices
  const binaryMatrix = metrics?.confusion_matrix
  const multiclassMatrix = multiclassMetrics?.confusion_matrix

  const total = result.total_records || 0

  return (

    <div className="results">

      {/* PDF download button */}
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
          <div className="accuracy">{total.toLocaleString()}</div>
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
          test dataset during model training.
        </p>

      </section>


      {/* Multiclass model performance */}
      <section className="panel">

        <div className="panel-title">
          <ChartNoAxesCombined size={18} />
          Multiclass model performance
        </div>

        {multiclassMetrics ? (
          <>
            <div className="two-col">

              <div className="metric-card">
                <span>Accuracy</span>
                <strong>{(multiclassAccuracy * 100).toFixed(2)}%</strong>
              </div>

              <div className="metric-card">
                <span>Macro F1-score</span>
                <strong>{(macroAverage['f1-score'] * 100).toFixed(2)}%</strong>
              </div>

              <div className="metric-card">
                <span>Weighted F1-score</span>
                <strong>{(weightedAverage['f1-score'] * 100).toFixed(2)}%</strong>
              </div>

              <div className="metric-card">
                <span>Macro Precision</span>
                <strong>{(macroAverage.precision * 100).toFixed(2)}%</strong>
              </div>

            </div>

            <p className="report-placeholder">
              Evaluation performed on 88,009 labelled test records
              across 10 traffic categories.
            </p>
          </>
        ) : (
          <div className="unavailable">
            <TriangleAlert size={25} />
            <strong>Multiclass metrics unavailable</strong>
            <span>Waiting for backend evaluation metrics.</span>
          </div>
        )}

      </section>


      {/* Multiclass classification report */}
      <section className="panel">

        <div className="panel-title">
          <Activity size={18} />
          Multiclass classification report
        </div>

        {multiclassPerformance.length > 0 ? (

          <div className="table-scroll">

            <table>
              <thead>
                <tr>
                  <th>Attack category</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1-score</th>
                  <th>Support</th>
                </tr>
              </thead>

              <tbody>
                {multiclassPerformance.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>{(item.precision * 100).toFixed(2)}%</td>
                    <td>{(item.recall * 100).toFixed(2)}%</td>
                    <td>{(item['f1-score'] * 100).toFixed(2)}%</td>
                    <td>{item.support.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>

        ) : (
          <div className="report-placeholder">
            Classification report is loading...
          </div>
        )}

        {macroAverage && weightedAverage && (
          <div className="table-scroll">

            <table>
              <thead>
                <tr>
                  <th>Average</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1-score</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>Macro average</td>
                  <td>{(macroAverage.precision * 100).toFixed(2)}%</td>
                  <td>{(macroAverage.recall * 100).toFixed(2)}%</td>
                  <td>{(macroAverage['f1-score'] * 100).toFixed(2)}%</td>
                </tr>

                <tr>
                  <td>Weighted average</td>
                  <td>{(weightedAverage.precision * 100).toFixed(2)}%</td>
                  <td>{(weightedAverage.recall * 100).toFixed(2)}%</td>
                  <td>{(weightedAverage['f1-score'] * 100).toFixed(2)}%</td>
                </tr>
              </tbody>
            </table>

          </div>
        )}

      </section>


      {/* Multiclass confusion matrix */}
      <section className="panel">

        <div className="panel-title">
          <Shield size={18} />
          Multiclass confusion matrix
        </div>

        {multiclassMatrix ? (

          <div className="table-scroll">

            <table className="multiclass-matrix">

              <thead>
                <tr>
                  <th>Actual ↓ / Predicted →</th>
                  {classNames.map((name) => (
                    <th key={name}>{name}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {multiclassMatrix.map((row, rowIndex) => (
                  <tr key={classNames[rowIndex]}>

                    <th>{classNames[rowIndex]}</th>

                    {row.map((value, colIndex) => (
                      <td
                        key={colIndex}
                        style={{
                          background:
                            rowIndex === colIndex
                              ? 'rgba(55, 214, 160, 0.18)'
                              : value > 0
                                ? 'rgba(255, 83, 107, 0.10)'
                                : 'transparent',
                          fontWeight:
                            rowIndex === colIndex ? 700 : 400
                        }}
                      >
                        {value.toLocaleString()}
                      </td>
                    ))}

                  </tr>
                ))}
              </tbody>

            </table>

          </div>

        ) : (
          <div className="unavailable">
            <TriangleAlert size={25} />
            <strong>Confusion matrix unavailable</strong>
          </div>
        )}

        <p className="report-placeholder">
          Rows represent actual classes. Columns represent predicted
          classes. Green diagonal cells indicate correct predictions.
        </p>

      </section>


      {/* Threat distribution and binary confusion matrix */}
      <div className="two-col">

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
                Evaluation dataset: 88,009 records
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

      </div>


      {/* Attack category breakdown */}
      <section className="panel">

        <div className="panel-title">
          <ChartNoAxesCombined size={18} />
          Attack category breakdown
        </div>

        {categories.length > 0 ? (

          <div className="table-scroll">

            <table>
              <thead>
                <tr>
                  <th>Attack category</th>
                  <th>Detected records</th>
                </tr>
              </thead>

              <tbody>
                {categories.map(([name, count]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>

        ) : (
          <div className="report-placeholder">
            No attack categories detected.
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
          SecureNet uses two trained deep learning classifiers.
          The binary classifier identifies benign and attack traffic,
          while the multiclass classifier categorizes traffic into
          10 classes. Evaluation metrics are calculated on a separate
          labelled test dataset.
        </div>

      </section>

    </div>

  )

}
