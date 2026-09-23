import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/crm/CustomersPage';
import { CustomerDetailPage } from './pages/crm/CustomerDetailPage';
import { OpportunitiesPage } from './pages/crm/OpportunitiesPage';
import { ProductsPage } from './pages/inventory/ProductsPage';
import { SuppliersPage } from './pages/inventory/SuppliersPage';
import { PurchaseOrdersPage } from './pages/inventory/PurchaseOrdersPage';
import { SalesOrdersPage } from './pages/sales/SalesOrdersPage';
import { InvoicesPage } from './pages/billing/InvoicesPage';
import { ChatPage } from './pages/ai/ChatPage';
import { AnalyticsPage } from './pages/ai/AnalyticsPage';
import { AutomationPage } from './pages/automation/AutomationPage';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="crm/customers" element={<CustomersPage />} />
        <Route path="crm/customers/:id" element={<CustomerDetailPage />} />
        <Route path="crm/opportunities" element={<OpportunitiesPage />} />
        <Route path="inventory/products" element={<ProductsPage />} />
        <Route path="inventory/suppliers" element={<SuppliersPage />} />
        <Route path="inventory/purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="sales/orders" element={<SalesOrdersPage />} />
        <Route path="billing/invoices" element={<InvoicesPage />} />
        <Route path="ai/chat" element={<ChatPage />} />
        <Route path="ai/analytics" element={<AnalyticsPage />} />
        <Route path="automation" element={<AutomationPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
