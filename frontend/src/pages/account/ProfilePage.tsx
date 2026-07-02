import { useState, type FormEvent } from 'react';
import { User, Lock } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatCPF, formatPhone, formatDate } from '../../utils/formatters';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await authApi.updateProfile(profileForm);
      await refreshUser();
      addToast('Perfil atualizado!', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro ao atualizar', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

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
    setSavingPassword(true);
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
      setSavingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header">
        <h1>Meu Perfil</h1>
        <p>Gerencie suas informações pessoais</p>
      </div>

      {/* Info Card */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--color-accent-light)', color: 'var(--color-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'var(--text-md)', fontWeight: 700
            }}>
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <div className="font-semibold">{user.firstName} {user.lastName}</div>
              <div className="text-sm text-secondary">{user.email}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
            <div>
              <span className="text-secondary">CPF</span>
              <div className="font-medium">{formatCPF(user.cpf)}</div>
            </div>
            <div>
              <span className="text-secondary">Telefone</span>
              <div className="font-medium">{formatPhone(user.phone)}</div>
            </div>
            <div>
              <span className="text-secondary">Data de Nascimento</span>
              <div className="font-medium">{formatDate(user.birthDate)}</div>
            </div>
            <div>
              <span className="text-secondary">Membro desde</span>
              <div className="font-medium">{formatDate(user.createdAt)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-body">
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} />
            Editar Perfil
          </h3>
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">Nome</label>
                <input className="form-input" value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Sobrenome</label>
                <input className="form-input" value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input className="form-input" value={profileForm.phone} maxLength={11}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingProfile} style={{ alignSelf: 'flex-start' }}>
              {savingProfile ? <div className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> : 'Salvar alterações'}
            </button>
          </form>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <div className="card-body">
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={18} />
            Alterar Senha
          </h3>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Senha atual</label>
              <input type="password" className="form-input" value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">Nova senha</label>
                <input type="password" className="form-input" value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar nova senha</label>
                <input type="password" className="form-input" value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-secondary" disabled={savingPassword} style={{ alignSelf: 'flex-start' }}>
              {savingPassword ? <div className="spinner" /> : 'Alterar senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
