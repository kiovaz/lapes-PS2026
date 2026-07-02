import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { validateCPF, validateEmail, onlyDigits } from '../../utils/validators';

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', cpf: '', phone: '', birthDate: '', password: '', confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const set = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.firstName || form.firstName.length < 2) errs.firstName = 'Mínimo 2 caracteres';
    if (!form.lastName || form.lastName.length < 2) errs.lastName = 'Mínimo 2 caracteres';
    if (!validateEmail(form.email)) errs.email = 'Email inválido';
    if (!validateCPF(onlyDigits(form.cpf))) errs.cpf = 'CPF inválido';
    if (!/^\d{10,11}$/.test(onlyDigits(form.phone))) errs.phone = '10 ou 11 dígitos';
    if (!form.birthDate) errs.birthDate = 'Data obrigatória';
    if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Senhas não coincidem';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await authApi.register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        cpf: onlyDigits(form.cpf),
        phone: onlyDigits(form.phone),
        birthDate: form.birthDate,
        password: form.password,
      });
      await login(data.access_token);
      addToast('Conta criada com sucesso!', 'success');
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao criar conta';
      addToast(typeof msg === 'string' ? msg : msg[0], 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <BookOpen size={32} color="var(--color-accent)" />
          </div>
          <h1>Criar conta</h1>
          <p>Preencha seus dados para começar</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-firstname">Nome</label>
              <input id="reg-firstname" className={`form-input ${errors.firstName ? 'error' : ''}`}
                placeholder="João" value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)} autoFocus />
              {errors.firstName && <span className="form-error">{errors.firstName}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-lastname">Sobrenome</label>
              <input id="reg-lastname" className={`form-input ${errors.lastName ? 'error' : ''}`}
                placeholder="Silva" value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)} />
              {errors.lastName && <span className="form-error">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email</label>
            <input id="reg-email" type="email" className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="seu@email.com" value={form.email}
              onChange={(e) => set('email', e.target.value)} autoComplete="email" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-cpf">CPF</label>
              <input id="reg-cpf" className={`form-input ${errors.cpf ? 'error' : ''}`}
                placeholder="12345678909" value={form.cpf} maxLength={14}
                onChange={(e) => set('cpf', e.target.value)} />
              {errors.cpf && <span className="form-error">{errors.cpf}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">Telefone</label>
              <input id="reg-phone" className={`form-input ${errors.phone ? 'error' : ''}`}
                placeholder="11999998888" value={form.phone} maxLength={11}
                onChange={(e) => set('phone', e.target.value)} />
              {errors.phone && <span className="form-error">{errors.phone}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-birth">Data de Nascimento</label>
            <input id="reg-birth" type="date" className={`form-input ${errors.birthDate ? 'error' : ''}`}
              value={form.birthDate}
              onChange={(e) => set('birthDate', e.target.value)} />
            {errors.birthDate && <span className="form-error">{errors.birthDate}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Senha</label>
              <input id="reg-password" type="password" className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="••••••" value={form.password}
                onChange={(e) => set('password', e.target.value)} autoComplete="new-password" />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">Confirmar Senha</label>
              <input id="reg-confirm" type="password" className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="••••••" value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)} autoComplete="new-password" />
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <div className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> : 'Criar conta'}
          </button>
        </form>

        <div className="auth-footer">
          Já tem uma conta? <Link to="/login">Entrar</Link>
        </div>
      </div>
    </div>
  );
}
