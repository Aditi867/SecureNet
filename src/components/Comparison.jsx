
import {
  Brain,
  Trees,
  Target,
  Clock,
  Zap,
  TrendingUp
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

const modelColors = {
  'Deep Learning': '#38bdf8',
  'Decision Tree': '#f59e0b',
  'Random Forest': '#a78bfa',
  'Logistic Regression': '#34d399',
  'Gaussian Naive Bayes': '#fb7185',
  'XGBoost': '#f97316'
}

const modelNames = [
  'Deep Learning',
  'Decision Tree',
  'Random Forest',
  'Logistic Regression',
  'Gaussian Naive Bayes',
  'XGBoost'
]

function MetricCard({ title, values, icon: Icon }) {
  return (
    <div className="comparison-card">
      <div className="comparison-card-header">
        <span>{title}</span>
        <Icon size={19} />
      </div>

      <div className="comparison-values">
        {values.map((item) => (
          <div key={item.name}>
            <span className="comparison-label">{item.name}</span>
            <h2>{item.value}</h2>
          </div>
        ))}
      </div>
    </div>
  )
}

function PerformanceChart({ title, data, height = 340, unit = '%' }) {
  return (
    <div className="comparison-chart-card">
      <h3>{title}</h3>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#26364d" />
          <XAxis dataKey="metric" stroke="#a7b6ca" />
          <YAxis
            stroke="#a7b6ca"
            domain={unit === '%' ? [0, 100] : [0, 'auto']}
          />
          <Tooltip
            formatter={(value) => [
              `${Number(value).toFixed(2)}${unit}`,
              'Value'
            ]}
          />
          <Legend />

          {modelNames.map((name) => (
            <Bar
              key={name}
              dataKey={name}
              fill={modelColors[name]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Comparison({ comparisonMetrics }) {
  if (!comparisonMetrics) {
    return (
      <div className="empty-state">
        <h3>Loading comparison metrics...</h3>
        <p>Please wait while SecureNet fetches model results.</p>
      </div>
    )
  }

  const binaryDL = comparisonMetrics.binary.deep_learning
  const binaryML = comparisonMetrics.binary.machine_learning

  const multiDL = comparisonMetrics.multiclass.deep_learning
  const multiML = comparisonMetrics.multiclass.machine_learning

  const binaryModels = binaryML.models || {}
  const multiclassModels = multiML.models || {}

  const multiDLAccuracy =
    multiDL.accuracy ?? multiDL.classification_report.accuracy

  const getBinaryValues = (metric) => [
    {
      name: 'Deep Learning',
      value: binaryDL[metric]
    },
    ...Object.entries(binaryModels).map(([name, model]) => ({
      name,
      value: model[metric]
    }))
  ]

  const getMulticlassValues = (metric) => [
    {
      name: 'Deep Learning',
      value: metric === 'accuracy'
        ? multiDLAccuracy
        : multiDL.classification_report['macro avg'][
            metric === 'macro_f1' ? 'f1-score' : metric.replace('macro_', '')
          ]
    },
    ...Object.entries(multiclassModels).map(([name, model]) => ({
      name,
      value: model[metric]
    }))
  ]

  const formatValues = (values) =>
    values.map((item) => ({
      name: item.name,
      value: `${(item.value * 100).toFixed(2)}%`
    }))

  const binaryData = [
    {
      metric: 'Accuracy',
      ...Object.fromEntries(getBinaryValues('accuracy').map(x => [x.name, x.value * 100]))
    },
    {
      metric: 'Precision',
      ...Object.fromEntries(getBinaryValues('precision').map(x => [x.name, x.value * 100]))
    },
    {
      metric: 'Recall',
      ...Object.fromEntries(getBinaryValues('recall').map(x => [x.name, x.value * 100]))
    },
    {
      metric: 'F1 Score',
      ...Object.fromEntries(getBinaryValues('f1_score').map(x => [x.name, x.value * 100]))
    }
  ]

  const multiclassData = [
    {
      metric: 'Accuracy',
      ...Object.fromEntries(getMulticlassValues('accuracy').map(x => [x.name, x.value * 100]))
    },
    {
      metric: 'Macro Precision',
      ...Object.fromEntries(getMulticlassValues('macro_precision').map(x => [x.name, x.value * 100]))
    },
    {
      metric: 'Macro Recall',
      ...Object.fromEntries(getMulticlassValues('macro_recall').map(x => [x.name, x.value * 100]))
    },
    {
      metric: 'Macro F1',
      ...Object.fromEntries(getMulticlassValues('macro_f1').map(x => [x.name, x.value * 100]))
    }
  ]

  const timeData = [
    {
      metric: 'Binary Training',
      'Deep Learning': binaryDL.training_time,
      ...Object.fromEntries(
        Object.entries(binaryModels).map(([name, model]) => [name, model.training_time])
      )
    },
    {
      metric: 'Multiclass Training',
      'Deep Learning': multiDL.training_time,
      ...Object.fromEntries(
        Object.entries(multiclassModels).map(([name, model]) => [name, model.training_time])
      )
    },
    {
      metric: 'Binary Inference',
      'Deep Learning': binaryDL.inference_time,
      ...Object.fromEntries(
        Object.entries(binaryModels).map(([name, model]) => [name, model.inference_time])
      )
    },
    {
      metric: 'Multiclass Inference',
      'Deep Learning': multiDL.inference_time,
      ...Object.fromEntries(
        Object.entries(multiclassModels).map(([name, model]) => [name, model.inference_time])
      )
    }
  ]

  return (
    <div className="comparison-page">

      <div className="comparison-intro">
        <h2>Model Performance Comparison</h2>
        <p>
          Comparing five machine learning algorithms with a
          Multi-Layer Perceptron on the UNSW-NB15 dataset.
        </p>
      </div>

      <section className="comparison-section">
        <div className="comparison-heading">
          <Target size={20} />
          <h2>Binary Classification</h2>
        </div>

        <div className="comparison-grid">
          <MetricCard
            title="Accuracy"
            values={formatValues(getBinaryValues('accuracy'))}
            icon={TrendingUp}
          />

          <MetricCard
            title="Precision"
            values={formatValues(getBinaryValues('precision'))}
            icon={Target}
          />

          <MetricCard
            title="Recall"
            values={formatValues(getBinaryValues('recall'))}
            icon={Zap}
          />

          <MetricCard
            title="F1 Score"
            values={formatValues(getBinaryValues('f1_score'))}
            icon={Brain}
          />
        </div>

        <PerformanceChart
          title="Binary Model Performance"
          data={binaryData}
        />
      </section>

      <section className="comparison-section">
        <div className="comparison-heading">
          <Trees size={20} />
          <h2>Multiclass Classification</h2>
        </div>

        <div className="comparison-grid">
          <MetricCard
            title="Accuracy"
            values={formatValues(getMulticlassValues('accuracy'))}
            icon={TrendingUp}
          />

          <MetricCard
            title="Macro Precision"
            values={formatValues(getMulticlassValues('macro_precision'))}
            icon={Target}
          />

          <MetricCard
            title="Macro Recall"
            values={formatValues(getMulticlassValues('macro_recall'))}
            icon={Zap}
          />

          <MetricCard
            title="Macro F1 Score"
            values={formatValues(getMulticlassValues('macro_f1'))}
            icon={Brain}
          />
        </div>

        <PerformanceChart
          title="Multiclass Model Performance"
          data={multiclassData}
        />
      </section>

      <section className="comparison-section">
        <div className="comparison-heading">
          <Clock size={20} />
          <h2>Computational Performance</h2>
        </div>

        <div className="comparison-chart-card">
          <h3>Training and Inference Time</h3>

          <p className="comparison-note">
            Lower time indicates faster model execution.
            Values are measured in seconds.
          </p>

          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#26364d" />
              <XAxis dataKey="metric" stroke="#a7b6ca" />
              <YAxis stroke="#a7b6ca" />
              <Tooltip />
              <Legend />

              {modelNames.map((name) => (
                <Bar
                  key={name}
                  dataKey={name}
                  fill={modelColors[name]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

    </div>
  )
}