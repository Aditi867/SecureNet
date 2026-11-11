
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


function MetricCard({ title, mlp, rf, icon: Icon }) {
  return (
    <div className="comparison-card">
      <div className="comparison-card-header">
        <span>{title}</span>
        <Icon size={19} />
      </div>

      <div className="comparison-values">
        <div>
          <span className="comparison-label">Deep Learning</span>
          <h2>{mlp}</h2>
        </div>

        <div>
          <span className="comparison-label">Random Forest</span>
          <h2>{rf}</h2>
        </div>
      </div>
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
  const multiDLAccuracy =
  multiDL.accuracy ?? multiDL.classification_report.accuracy


  const binaryData = [
    {
      metric: 'Accuracy',
      'Deep Learning': binaryDL.accuracy * 100,
      'Random Forest': binaryML.accuracy * 100
    },
    {
      metric: 'Precision',
      'Deep Learning': binaryDL.precision * 100,
      'Random Forest': binaryML.precision * 100
    },
    {
      metric: 'Recall',
      'Deep Learning': binaryDL.recall * 100,
      'Random Forest': binaryML.recall * 100
    },
    {
      metric: 'F1 Score',
      'Deep Learning': binaryDL.f1_score * 100,
      'Random Forest': binaryML.f1_score * 100
    }
  ]


  const multiclassData = [
    {
      metric: 'Accuracy',
      'Deep Learning': multiDLAccuracy * 100,
      'Random Forest': multiML.accuracy * 100
    },
    {
      metric: 'Macro Precision',
      'Deep Learning': multiDL['classification_report']['macro avg'].precision * 100,
      'Random Forest': multiML.macro_precision * 100
    },
    {
      metric: 'Macro Recall',
      'Deep Learning': multiDL['classification_report']['macro avg'].recall * 100,
      'Random Forest': multiML.macro_recall * 100
    },
    {
      metric: 'Macro F1',
      'Deep Learning': multiDL['classification_report']['macro avg']['f1-score'] * 100,
      'Random Forest': multiML.macro_f1 * 100
    }
  ]


  const timeData = [
    {
      model: 'Binary Training',
      'Deep Learning': binaryDL.training_time,
      'Random Forest': binaryML.training_time
    },
    {
      model: 'Multiclass Training',
      'Deep Learning': multiDL.training_time,
      'Random Forest': multiML.training_time
    },
    {
      model: 'Binary Inference',
      'Deep Learning': binaryDL.inference_time,
      'Random Forest': binaryML.inference_time
    },
    {
      model: 'Multiclass Inference',
      'Deep Learning': multiDL.inference_time,
      'Random Forest': multiML.inference_time
    }
  ]


  return (
    <div className="comparison-page">

      <div className="comparison-intro">
        <h2>Machine Learning vs Deep Learning</h2>
        <p>
          Comparing Random Forest and Multi-Layer Perceptron
          performance on the UNSW-NB15 dataset.
        </p>
      </div>


      {/* Binary Detection */}
      <section className="comparison-section">

        <div className="comparison-heading">
          <Target size={20} />
          <h2>Binary Classification</h2>
        </div>

        <div className="comparison-grid">

          <MetricCard
            title="Accuracy"
            mlp={`${(binaryDL.accuracy * 100).toFixed(2)}%`}
            rf={`${(binaryML.accuracy * 100).toFixed(2)}%`}
            icon={TrendingUp}
          />

          <MetricCard
            title="Precision"
            mlp={`${(binaryDL.precision * 100).toFixed(2)}%`}
            rf={`${(binaryML.precision * 100).toFixed(2)}%`}
            icon={Target}
          />

          <MetricCard
            title="Recall"
            mlp={`${(binaryDL.recall * 100).toFixed(2)}%`}
            rf={`${(binaryML.recall * 100).toFixed(2)}%`}
            icon={Zap}
          />

          <MetricCard
            title="F1 Score"
            mlp={`${(binaryDL.f1_score * 100).toFixed(2)}%`}
            rf={`${(binaryML.f1_score * 100).toFixed(2)}%`}
            icon={Brain}
          />

        </div>

        <div className="comparison-chart-card">
          <h3>Binary Model Performance</h3>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={binaryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#26364d" />
              <XAxis dataKey="metric" stroke="#a7b6ca" />
              <YAxis domain={[0, 100]} stroke="#a7b6ca" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Deep Learning" fill="#38bdf8" radius={[5, 5, 0, 0]} />
              <Bar dataKey="Random Forest" fill="#a78bfa" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </section>


      {/* Multiclass Detection */}
      <section className="comparison-section">

        <div className="comparison-heading">
          <Trees size={20} />
          <h2>Multiclass Classification</h2>
        </div>

        <div className="comparison-grid">

          <MetricCard
            title="Accuracy"
            mlp={`${(multiDLAccuracy * 100).toFixed(2)}%`}
            rf={`${(multiML.accuracy * 100).toFixed(2)}%`}
            icon={TrendingUp}
          />

          <MetricCard
            title="Macro Precision"
            mlp={`${(multiDL['classification_report']['macro avg'].precision * 100).toFixed(2)}%`}
            rf={`${(multiML.macro_precision * 100).toFixed(2)}%`}
            icon={Target}
          />

          <MetricCard
            title="Macro Recall"
            mlp={`${(multiDL['classification_report']['macro avg'].recall * 100).toFixed(2)}%`}
            rf={`${(multiML.macro_recall * 100).toFixed(2)}%`}
            icon={Zap}
          />

          <MetricCard
            title="Macro F1 Score"
            mlp={`${(multiDL['classification_report']['macro avg']['f1-score'] * 100).toFixed(2)}%`}
            rf={`${(multiML.macro_f1 * 100).toFixed(2)}%`}
            icon={Brain}
          />

        </div>

        <div className="comparison-chart-card">
          <h3>Multiclass Model Performance</h3>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={multiclassData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#26364d" />
              <XAxis dataKey="metric" stroke="#a7b6ca" />
              <YAxis domain={[0, 100]} stroke="#a7b6ca" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Deep Learning" fill="#38bdf8" radius={[5, 5, 0, 0]} />
              <Bar dataKey="Random Forest" fill="#a78bfa" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </section>


      {/* Training and Inference Time */}
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

          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#26364d" />
              <XAxis dataKey="model" stroke="#a7b6ca" />
              <YAxis stroke="#a7b6ca" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Deep Learning" fill="#38bdf8" radius={[5, 5, 0, 0]} />
              <Bar dataKey="Random Forest" fill="#a78bfa" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

        </div>

      </section>

    </div>
  )
}
