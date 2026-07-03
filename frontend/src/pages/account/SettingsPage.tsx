import { useState, type FormEvent } from 'react';
import { Lock, Shield } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      addToast('A nova senha deve ter pelo menos 6 caracteres', 'warning');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast('As senhas não coincidem', 'warning');
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      addToast('Senha alterada com sucesso!', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro ao alterar senha', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header">
        <h1>Configurações</h1>
        <p>Segurança e preferências da conta</p>
      </div>

      {/* Security */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-body">
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={18} />
            Alterar Senha
          </h3>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="settings-current-pw">Senha atual</label>
              <input
                id="settings-current-pw"
                type="password"
                className="form-input"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                autoComplete="current-password"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="settings-new-pw">Nova senha</label>
                <input
                  id="settings-new-pw"
                  type="password"
                  className="form-input"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="settings-confirm-pw">Confirmar</label>
                <input
                  id="settings-confirm-pw"
                  type="password"
                  className="form-input"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
              {saving ? <div className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> : 'Alterar senha'}
            </button>
          </form>
        </div>
      </div>

      {/* Account Info */}
      <div className="card">
        <div className="card-body">
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} />
            Informações da Conta
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-secondary">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-secondary">Papel</span>
              <span className={`badge ${user.role === 'ADMIN' ? 'badge-info' : 'badge-neutral'}`}>
                {user.role === 'ADMIN' ? 'Administrador' : 'Cliente'}
              </span>
            </div>
            <p className="text-xs text-tertiary" style={{ marginTop: 'var(--space-2)' }}>
              Para alterações no email ou CPF, entre em contato com o suporte.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
