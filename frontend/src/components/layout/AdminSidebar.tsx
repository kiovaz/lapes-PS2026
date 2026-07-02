import { NavLink, Link, useNavigate } from 'react-router-dom';
import { BookOpen, Package, ShoppingBag, Tag, LogOut, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <Link to="/admin/products" className="sidebar-logo">
        <BookOpen size={20} />
        LAPES Admin
      </Link>

      <nav className="sidebar-nav">
        <span className="sidebar-label">Gerenciamento</span>

        <NavLink to="/admin/products" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <ShoppingBag size={18} />
          Produtos
        </NavLink>

        <NavLink to="/admin/orders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Package size={18} />
          Pedidos
        </NavLink>

        <NavLink to="/admin/coupons" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Tag size={18} />
          Cupons
        </NavLink>

        <span className="sidebar-label">Sistema</span>

        <Link to="/" className="sidebar-link">
          <ChevronLeft size={18} />
          Voltar à Loja
        </Link>
      </nav>

      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', marginBottom: '4px' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--color-accent-light)', color: 'var(--color-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 600
          }}>
            {user?.firstName[0]}{user?.lastName[0]}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>{user?.firstName}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Admin</div>
          </div>
        </div>
        <button className="sidebar-link" onClick={handleLogout} style={{ width: '100%', color: 'var(--color-error)' }}>
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
