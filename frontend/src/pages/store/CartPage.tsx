import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, BookOpen, ArrowRight } from 'lucide-react';
import { cartApi } from '../../api/cart';
import { couponsApi } from '../../api/coupons';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency, toNumber } from '../../utils/formatters';
import type { Cart, CouponValidation } from '../../types';

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<CouponValidation | null>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const { refreshCart } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchCart = async () => {
    setLoading(true);
    try {
      const data = await cartApi.get();
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const subtotal = cart?.items?.reduce((sum, item) => sum + toNumber(item.product.price) * item.quantity, 0) ?? 0;

  const handleUpdateQty = async (itemId: number, quantity: number) => {
    try {
      await cartApi.updateItem(itemId, { quantity });
      await fetchCart();
      await refreshCart();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro ao atualizar', 'error');
    }
  };

  const handleRemove = async (itemId: number) => {
    try {
      await cartApi.removeItem(itemId);
      await fetchCart();
      await refreshCart();
      addToast('Item removido', 'info');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro ao remover', 'error');
    }
  };

  const handleClear = async () => {
    try {
      await cartApi.clear();
      await fetchCart();
      await refreshCart();
      addToast('Carrinho limpo', 'info');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro', 'error');
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError('');
    setCouponResult(null);
    setValidatingCoupon(true);
    try {
      const result = await couponsApi.validate({ code: couponCode.trim().toUpperCase(), subtotal });
      setCouponResult(result);
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Cupom inválido');
    } finally {
      setValidatingCoupon(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-state">
        <ShoppingBag size={48} className="empty-state-icon" />
        <h3 className="empty-state-title">Carrinho vazio</h3>
        <p className="empty-state-description">Adicione livros ao seu carrinho para continuar.</p>
        <Link to="/" className="btn btn-primary">Ver catálogo</Link>
      </div>
    );
  }

  const discount = couponResult ? couponResult.discount : 0;
  const total = subtotal - discount;

  return (
    <div>
      <div className="page-header page-header-actions">
        <div>
          <h1>Carrinho</h1>
          <p>{cart.items.length} {cart.items.length === 1 ? 'item' : 'itens'}</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleClear}>
          <Trash2 size={14} />
          Limpar carrinho
        </button>
      </div>

      <div className="cart-layout">
        <div>
          {cart.items.map((item) => (
            <div key={item.id} className="cart-item">
              {item.product.image ? (
                <img src={item.product.image} alt={item.product.name} className="cart-item-image" />
              ) : (
                <div className="cart-item-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={24} color="var(--color-text-tertiary)" />
                </div>
              )}
              <div className="cart-item-info">
                <Link to={`/products/${item.productId}`} className="cart-item-name" style={{ color: 'inherit', textDecoration: 'none' }}>
                  {item.product.name}
                </Link>
                <div className="cart-item-price">{formatCurrency(toNumber(item.product.price))}</div>
                <div className="cart-item-actions">
                  <div className="qty-control">
                    <button onClick={() => handleUpdateQty(item.id, Math.max(1, item.quantity - 1))}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleUpdateQty(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleRemove(item.id)} style={{ color: 'var(--color-error)' }}>
                    <Trash2 size={14} />
                  </button>
                  <span className="text-sm font-medium" style={{ marginLeft: 'auto' }}>
                    {formatCurrency(toNumber(item.product.price) * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Resumo</h3>

              <div className="summary-row">
                <span className="text-secondary">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="summary-row" style={{ color: 'var(--color-success)' }}>
                  <span>Desconto ({couponResult?.coupon.code})</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}

              <div className="summary-row total">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>

              <div style={{ marginTop: 'var(--space-5)' }}>
                <label className="form-label" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>Cupom de desconto</label>
                <div className="coupon-input">
                  <input
                    className="form-input"
                    placeholder="Ex: CUPOM10"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value); setCouponResult(null); setCouponError(''); }}
                  />
                  <button className="btn btn-secondary" onClick={handleValidateCoupon} disabled={validatingCoupon}>
                    {validatingCoupon ? <div className="spinner" /> : 'Aplicar'}
                  </button>
                </div>
                {couponResult && (
                  <div className="coupon-result valid">
                    ✓ Cupom aplicado! Desconto de {formatCurrency(couponResult.discount)}
                  </div>
                )}
                {couponError && (
                  <div className="coupon-result invalid">✕ {couponError}</div>
                )}
              </div>

              <button
                className="btn btn-primary btn-lg w-full"
                style={{ marginTop: 'var(--space-5)' }}
                onClick={() => navigate('/checkout', { state: { couponCode: couponResult ? couponCode : undefined } })}
              >
                Finalizar compra
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
