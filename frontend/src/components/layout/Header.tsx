import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, BookOpen, User, LogOut, Package, Settings, MapPin, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '';

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <BookOpen size={20} />
          LAPES Books
        </Link>

        <nav className="header-nav">
          <NavLink to="/" end className={({ isActive }) => `header-nav-link ${isActive ? 'active' : ''}`}>
            Catálogo
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/orders" className={({ isActive }) => `header-nav-link ${isActive ? 'active' : ''}`}>
                <Package size={16} />
                Pedidos
              </NavLink>
              <NavLink to="/wishlist" className={({ isActive }) => `header-nav-link ${isActive ? 'active' : ''}`}>
                <Heart size={16} />
                Favoritos
              </NavLink>
            </>
          )}
        </nav>

        <div className="header-actions">
          {isAuthenticated ? (
            <>
              <Link to="/cart" className="btn btn-ghost btn-icon cart-badge" aria-label="Carrinho">
                <ShoppingCart size={18} />
                {itemCount > 0 && <span className="cart-badge-count">{itemCount}</span>}
              </Link>

              <div className="user-menu" ref={menuRef}>
                <button
                  className="user-menu-trigger"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Menu do usuário"
                >
                  {initials}
                </button>

                {menuOpen && (
                  <div className="user-menu-dropdown">
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{user?.firstName} {user?.lastName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{user?.email}</div>
                    </div>
                    {isAdmin && (
                      <Link to="/admin/products" className="user-menu-item" onClick={() => setMenuOpen(false)}>
                        <LayoutDashboard size={16} />
                        Painel Admin
                      </Link>
                    )}
                    <Link to="/profile" className="user-menu-item" onClick={() => setMenuOpen(false)}>
                      <User size={16} />
                      Meu Perfil
                    </Link>
                    <Link to="/addresses" className="user-menu-item" onClick={() => setMenuOpen(false)}>
                      <MapPin size={16} />
                      Endereços
                    </Link>
                    <Link to="/orders" className="user-menu-item" onClick={() => setMenuOpen(false)}>
                      <Package size={16} />
                      Meus Pedidos
                    </Link>
                    <Link to="/settings" className="user-menu-item" onClick={() => setMenuOpen(false)}>
                      <Settings size={16} />
                      Configurações
                    </Link>
                    <div className="user-menu-divider" />
                    <button className="user-menu-item danger" onClick={handleLogout}>
                      <LogOut size={16} />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Entrar</Link>
              <Link to="/register" className="btn btn-primary">Criar conta</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
