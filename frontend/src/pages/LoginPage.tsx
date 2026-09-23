import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { Card, CardBody } from '../components/ui/Card';

export function LoginPage() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@gideon.local');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Ocurrio un error, intenta de nuevo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-plane dark:bg-plane-dark px-4">
      <Card className="w-full max-w-sm">
        <CardBody>
          <h1 className="text-xl font-semibold">Gideon</h1>
          <p className="mb-4 text-sm text-ink-secondary dark:text-ink-secondary-dark">
            Sistema de gestion empresarial + IA + automatizacion
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div>
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Contrasena</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && <p className="text-sm text-status-critical">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Procesando...' : mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}
            </Button>
          </form>

          <button
            className="mt-3 text-xs text-ink-secondary dark:text-ink-secondary-dark hover:text-series-1"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Crear una cuenta nueva' : 'Ya tengo cuenta, iniciar sesion'}
          </button>

          {mode === 'login' && (
            <p className="mt-3 text-xs text-ink-muted">
              Usuario demo: admin@gideon.local / Admin123! (creado por el seed)
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
