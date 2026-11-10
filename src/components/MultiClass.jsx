
import {
  Activity,
  ChartNoAxesCombined,
  Shield,
  TriangleAlert
} from 'lucide-react'

export default function MultiClass({ multiclassMetrics }) {

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

  if (!multiclassMetrics) {
    return (
      <section className="panel">
        <div className="unavailable">
          <TriangleAlert size={25} />
          <strong>Multiclass metrics unavailable</strong>
          <span>Check that the backend is running.</span>
        </div>
      </section>
    )
  }

  const report = multiclassMetrics.classification_report || {}
  const matrix = multiclassMetrics.confusion_matrix || []

  const macro = report['macro avg'] || {}
  const weighted = report['weighted avg'] || {}

  const classMetrics = classNames
    .filter(name => report[name])
    .map(name => ({
      name,
      ...report[name]
    }))

  const accuracy = report.accuracy || 0

  return (
    <div className="results">

      {/* Overview */}
      <section className="result-banner">
        <div>
          <span className="eyebrow">MULTICLASS MODEL</span>
          <div className="accuracy">
            {(accuracy * 100).toFixed(2)}%
          </div>
          <p>Overall classification accuracy</p>
        </div>
        <Activity size={39} />
      </section>

      {/* Performance metrics */}
      <section className="panel">

        <div className="panel-title">
          <ChartNoAxesCombined size={18} />
          Model performance
        </div>

        <div className="two-col">

          <div className="metric-card">
            <span>Accuracy</span>
            <strong>{(accuracy * 100).toFixed(2)}%</strong>
          </div>

          <div className="metric-card">
            <span>Macro Precision</span>
            <strong>
              {((macro.precision || 0) * 100).toFixed(2)}%
            </strong>
          </div>

          <div className="metric-card">
            <span>Macro Recall</span>
            <strong>
              {((macro.recall || 0) * 100).toFixed(2)}%
            </strong>
          </div>

          <div className="metric-card">
            <span>Macro F1-score</span>
            <strong>
              {((macro['f1-score'] || 0) * 100).toFixed(2)}%
            </strong>
          </div>

          <div className="metric-card">
            <span>Weighted F1-score</span>
            <strong>
              {((weighted['f1-score'] || 0) * 100).toFixed(2)}%
            </strong>
          </div>

          <div className="metric-card">
            <span>Test records</span>
            <strong>88,009</strong>
          </div>

        </div>

      </section>

      {/* Classification report */}
      <section className="panel">

        <div className="panel-title">
          <Activity size={18} />
          Classification report
        </div>

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
              {classMetrics.map(item => (
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
                <td>{((macro.precision || 0) * 100).toFixed(2)}%</td>
                <td>{((macro.recall || 0) * 100).toFixed(2)}%</td>
                <td>{((macro['f1-score'] || 0) * 100).toFixed(2)}%</td>
              </tr>

              <tr>
                <td>Weighted average</td>
                <td>{((weighted.precision || 0) * 100).toFixed(2)}%</td>
                <td>{((weighted.recall || 0) * 100).toFixed(2)}%</td>
                <td>{((weighted['f1-score'] || 0) * 100).toFixed(2)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

      </section>

      {/* Confusion matrix */}
      <section className="panel">

        <div className="panel-title">
          <Shield size={18} />
          Multiclass confusion matrix
        </div>

        {matrix.length > 0 ? (
          <div className="table-scroll">

            <table className="multiclass-matrix">
              <thead>
                <tr>
                  <th>Actual ↓ / Predicted →</th>
                  {classNames.map(name => (
                    <th key={name}>{name}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {matrix.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <th>{classNames[rowIndex]}</th>

                    {row.map((value, colIndex) => (
                      <td
                        key={colIndex}
                        style={{
                          background: rowIndex === colIndex
                            ? 'rgba(55, 214, 160, 0.18)'
                            : value > 0
                              ? 'rgba(255, 83, 107, 0.10)'
                              : 'transparent'
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
          <p className="report-placeholder">
            Confusion matrix unavailable.
          </p>
        )}

        <p className="report-placeholder">
          Rows represent actual classes and columns represent
          predicted classes. Green diagonal cells indicate
          correct classifications.
        </p>

      </section>

      {/* Model note */}
      <section className="panel">
        <div className="panel-title">
          <Shield size={18} />
          Model information
        </div>

        <p className="report-placeholder">
          The multiclass deep learning classifier identifies
          network traffic across 10 categories: Analysis,
          Backdoor, Benign, DoS, Exploits, Fuzzers, Generic,
          Reconnaissance, Shellcode and Worms.
        </p>
      </section>

    </div>
  )
}
