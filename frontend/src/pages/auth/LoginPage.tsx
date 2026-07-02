import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email) return setErrors({ email: 'O email é obrigatório' });
    if (!password) return setErrors({ password: 'A senha é obrigatória' });
    if (password.length < 6) return setErrors({ password: 'Mínimo de 6 caracteres' });

    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      await login(data.access_token);
      addToast('Login realizado com sucesso!', 'success');
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao fazer login';
      addToast(typeof msg === 'string' ? msg : msg[0], 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <BookOpen size={32} color="var(--color-accent)" />
          </div>
          <h1>Bem-vindo de volta</h1>
          <p>Entre na sua conta para continuar</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Senha</label>
            <input
              id="login-password"
              type="password"
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <div className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> : 'Entrar'}
          </button>
        </form>

        <div className="auth-footer">
          Não tem uma conta? <Link to="/register">Criar conta</Link>
        </div>
      </div>
    </div>
  );
}
