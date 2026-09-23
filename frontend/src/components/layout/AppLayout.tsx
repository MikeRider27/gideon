import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/crm/customers', label: 'Clientes' },
  { to: '/crm/opportunities', label: 'Oportunidades' },
  { to: '/inventory/products', label: 'Productos' },
  { to: '/inventory/suppliers', label: 'Proveedores' },
  { to: '/inventory/purchase-orders', label: 'Compras' },
  { to: '/sales/orders', label: 'Ventas' },
  { to: '/billing/invoices', label: 'Facturacion' },
  { to: '/ai/chat', label: 'Asistente IA' },
  { to: '/ai/analytics', label: 'Analitica IA' },
  { to: '/automation', label: 'Automatizacion' },
];

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-grid dark:border-grid-dark bg-surface dark:bg-surface-dark flex flex-col">
        <div className="px-4 py-4 border-b border-grid dark:border-grid-dark">
          <p className="text-lg font-semibold">Gideon</p>
          <p className="text-xs text-ink-muted">Gestion + IA + Automatizacion</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-series-1/15 text-series-1'
                    : 'text-ink-secondary dark:text-ink-secondary-dark hover:bg-plane dark:hover:bg-plane-dark'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-grid dark:border-grid-dark p-3">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-ink-muted">{user?.role}</p>
          <button
            onClick={logout}
            className="mt-2 text-xs font-medium text-ink-secondary dark:text-ink-secondary-dark hover:text-status-critical"
          >
            Cerrar sesion
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-plane dark:bg-plane-dark">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
