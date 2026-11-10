
import {
  Shield,
  Activity,
  TriangleAlert,
  ChartNoAxesCombined,
  ShieldCheck
} from 'lucide-react'

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts'

export default function Results({ result }) {

  const chartData = [
    { name: 'Attack', value: result.attack_count || 0 },
    { name: 'Benign', value: result.benign_count || 0 }
  ]

  const matrix = result.confusion_matrix

  return (
    <div className="results">

      {/* Detection accuracy */}
      <div className="result-banner">
        <div>
          <span className="eyebrow">DETECTION ACCURACY</span>

          <div className="accuracy">
            {result.accuracy == null
              ? 'Not available'
              : `${(result.accuracy * 100).toFixed(2)}%`}
          </div>

          <p>
            {result.accuracy == null
              ? 'Ground-truth labels are required to calculate accuracy.'
              : 'Calculated on labelled evaluation records.'}
          </p>
        </div>

        <ShieldCheck size={39} />
      </div>

      {/* Demo warning */}
      {result.is_demo && (
        <div className="demo-note">
          <TriangleAlert size={16} />
          Demo preview: these counts are illustrative,
          not predictions from a trained model.
        </div>
      )}

      <div className="two-col">

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
              <strong>
                {(result.total_records || 0).toLocaleString()}
              </strong>
              <span>Records</span>
            </div>
          </div>

          <div className="legend">
            <span>
              <i className="red" /> Attack
              <b>{(result.attack_count || 0).toLocaleString()}</b>
            </span>

            <span>
              <i className="green" /> Benign
              <b>{(result.benign_count || 0).toLocaleString()}</b>
            </span>
          </div>
        </section>

        {/* Confusion matrix */}
        <section className="panel">
          <div className="panel-title">
            <Shield size={18} />
            Confusion matrix
          </div>

          {matrix ? (
            <div className="matrix">
              <div className="matrix-label">
                Predicted →
              </div>

              <div className="matrix-grid">
                <span>{matrix[0][0]}</span>
                <span>{matrix[0][1]}</span>
                <span>{matrix[1][0]}</span>
                <span>{matrix[1][1]}</span>
              </div>

              <div className="matrix-caption">
                Rows: actual class · Columns: predicted class
              </div>
            </div>
          ) : (
            <div className="unavailable">
              <ChartNoAxesCombined size={25} />
              <strong>Not available</strong>
              <span>
                Upload labelled data to calculate a confusion matrix.
              </span>
            </div>
          )}
        </section>
      </div>

      {/* Classification report */}
      <section className="panel">
        <div className="panel-title">
          <ChartNoAxesCombined size={18} />
          Classification report
        </div>

        {result.classification_report ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1-score</th>
                </tr>
              </thead>

              <tbody>
                {Object.entries(result.classification_report).map(
                  ([key, value]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{Number(value.precision).toFixed(2)}</td>
                      <td>{Number(value.recall).toFixed(2)}</td>
                      <td>{Number(value['f1-score']).toFixed(2)}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="report-placeholder">
            A classification report will be shown when labelled
            evaluation data is provided by the backend.
          </div>
        )}
      </section>

    </div>
  )
}
