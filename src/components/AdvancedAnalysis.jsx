
import {
  Activity,
  ChartNoAxesCombined,
  Shield,
  TriangleAlert
} from 'lucide-react'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts'

export default function AdvancedAnalysis({ multiclassMetrics }) {

  if (!multiclassMetrics) {
    return (
      <section className="panel">
        <div className="unavailable">
          <TriangleAlert size={25} />
          <strong>Analysis data unavailable</strong>
          <span>Make sure the backend is running.</span>
        </div>
      </section>
    )
  }

  const report = multiclassMetrics.classification_report || {}

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

  const classData = classNames
    .filter(name => report[name])
    .map(name => ({
      name,
      Precision: Number((report[name].precision * 100).toFixed(2)),
      Recall: Number((report[name].recall * 100).toFixed(2)),
      'F1-score': Number((report[name]['f1-score'] * 100).toFixed(2)),
      Support: report[name].support
    }))

  const sortedSupport = [...classData].sort(
    (a, b) => b.Support - a.Support
  )

  const hardestClasses = [...classData].sort(
    (a, b) => a['F1-score'] - b['F1-score']
  )

  const macro = report['macro avg'] || {}
  const weighted = report['weighted avg'] || {}

  const accuracy = report.accuracy || 0

  return (
    <div className="results">

      {/* Overview */}
      <section className="result-banner">
        <div>
          <span className="eyebrow">ADVANCED MODEL ANALYSIS</span>
          <div className="accuracy">
            {(accuracy * 100).toFixed(2)}%
          </div>
          <p>Multiclass classification accuracy</p>
        </div>

        <ChartNoAxesCombined size={39} />
      </section>

      {/* Summary metrics */}
      <section className="panel">

        <div className="panel-title">
          <Activity size={18} />
          Performance overview
        </div>

        <div className="two-col">

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

        </div>

      </section>

      {/* Class-wise performance */}
      <section className="panel">

        <div className="panel-title">
          <ChartNoAxesCombined size={18} />
          Class-wise performance comparison
        </div>

        <div style={{ width: '100%', height: 350 }}>

          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={classData}
              margin={{ top: 15, right: 15, left: 0, bottom: 65 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#29415e" />

              <XAxis
                dataKey="name"
                angle={-35}
                textAnchor="end"
                interval={0}
                height={85}
                tick={{ fill: '#a9bdd3', fontSize: 10 }}
              />

              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#a9bdd3', fontSize: 11 }}
              />

              <Tooltip
                contentStyle={{
                  background: '#12243a',
                  border: '1px solid #29415e',
                  borderRadius: 10
                }}
                formatter={(value) => `${value}%`}
              />

              <Legend />

              <Bar dataKey="Precision" fill="#38bdf8" />
              <Bar dataKey="Recall" fill="#37d6a0" />
              <Bar dataKey="F1-score" fill="#f5b942" />

            </BarChart>
          </ResponsiveContainer>

        </div>

      </section>

      {/* Category distribution */}
      <section className="panel">

        <div className="panel-title">
          <Activity size={18} />
          Test dataset class distribution
        </div>

        <div style={{ width: '100%', height: 350 }}>

          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedSupport}
              layout="vertical"
              margin={{ top: 10, right: 25, left: 15, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#29415e" />

              <XAxis
                type="number"
                tick={{ fill: '#a9bdd3', fontSize: 11 }}
              />

              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fill: '#a9bdd3', fontSize: 11 }}
              />

              <Tooltip
                contentStyle={{
                  background: '#12243a',
                  border: '1px solid #29415e',
                  borderRadius: 10
                }}
              />

              <Bar dataKey="Support" fill="#38bdf8" />

            </BarChart>
          </ResponsiveContainer>

        </div>

        <p className="report-placeholder">
          Support represents the number of actual test records
          belonging to each traffic category.
        </p>

      </section>

      {/* Weakest performing classes */}
      <section className="panel">

        <div className="panel-title">
          <TriangleAlert size={18} />
          Classes requiring improvement
        </div>

        <div className="table-scroll">

          <table>
            <thead>
              <tr>
                <th>Attack category</th>
                <th>F1-score</th>
                <th>Test records</th>
              </tr>
            </thead>

            <tbody>
              {hardestClasses.slice(0, 5).map(item => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>{item['F1-score'].toFixed(2)}%</td>
                  <td>{item.Support.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>

      </section>

      {/* Interpretation */}
      <section className="panel">

        <div className="panel-title">
          <Shield size={18} />
          Model observations
        </div>

        <p className="report-placeholder">
          The evaluation dataset has an uneven distribution of
          network traffic categories. Common classes have more
          training and test examples, while rare classes have
          limited representation.
        </p>

        <p className="report-placeholder">
          Accuracy and weighted F1-score should therefore be
          interpreted alongside macro F1-score and individual
          class performance. Rare categories may require
          additional data and further model improvements.
        </p>

      </section>

    </div>
  )
}
