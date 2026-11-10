import {
  Shield,
  Activity,
  TriangleAlert,
  ChartNoAxesCombined
} from 'lucide-react'

export default function Sidebar({ page, setPage }) {
  const items = [
    {
      id: 'binary',
      label: 'Binary Detection',
      icon: Activity
    },
    {
      id: 'multi',
      label: 'Multi-Class',
      icon: TriangleAlert
    },
    {
      id: 'advanced',
      label: 'Advanced Analysis',
      icon: ChartNoAxesCombined
    }
  ]

  return (
    <aside className="sidebar">

      <div className="brand">
        <span className="brand-icon">
          <Shield size={20} />
        </span>
        <span>SecureNet</span>
      </div>

      <div className="nav-label">WORKSPACE</div>

      {items.map((item) => {
        const Icon = item.icon

        return (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
          >
            <Icon size={17} />
            <span>{item.label}</span>
          </button>
        )
      })}

      <div className="sidebar-bottom">
        <div className="status-dot" />
        Model workspace
        <span className="status-text">SecureNet</span>
      </div>

    </aside>
  )
}