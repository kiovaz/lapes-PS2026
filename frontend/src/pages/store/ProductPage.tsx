import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, BookOpen, ArrowLeft, Check } from 'lucide-react';
import { productsApi } from '../../api/products';
import { cartApi } from '../../api/cart';
import { wishlistApi } from '../../api/wishlist';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency, toNumber } from '../../utils/formatters';
import type { Product } from '../../types';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const { isAuthenticated } = useAuth();
  const { refreshCart } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await productsApi.findOne(Number(id));
        setProduct(data);
        if (isAuthenticated) {
          const { isFavorited: fav } = await wishlistApi.check(Number(id));
          setIsFavorited(fav);
        }
      } catch {
        addToast('Produto não encontrado', 'error');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, isAuthenticated]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setAddingToCart(true);
    try {
      await cartApi.addItem({ productId: Number(id), quantity });
      await refreshCart();
      addToast('Adicionado ao carrinho!', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro ao adicionar', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      if (isFavorited) {
        await wishlistApi.remove(Number(id));
        setIsFavorited(false);
        addToast('Removido dos favoritos', 'info');
      } else {
        await wishlistApi.add(Number(id));
        setIsFavorited(true);
        addToast('Adicionado aos favoritos!', 'success');
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro', 'error');
    }
  };

  if (loading) {
    return (
      <div className="product-detail">
        <div className="skeleton" style={{ aspectRatio: '1' }} />
        <div>
          <div className="skeleton" style={{ height: 14, width: '30%', marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 32, width: '70%', marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 24, width: '25%', marginBottom: 24 }} />
          <div className="skeleton" style={{ height: 60, width: '100%', marginBottom: 24 }} />
          <div className="skeleton" style={{ height: 42, width: '50%' }} />
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div>
      <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: 'var(--space-6)' }}>
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="product-detail">
        <div>
          {product.image ? (
            <img src={product.image} alt={product.name} className="product-detail-image" />
          ) : (
            <div className="product-detail-image" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)'
            }}>
              <BookOpen size={64} color="var(--color-text-tertiary)" />
            </div>
          )}
        </div>

        <div>
          <div className="product-detail-category">{product.category}</div>
          <h1>{product.name}</h1>
          <div className="product-detail-price">{formatCurrency(toNumber(product.price))}</div>

          <p className="product-detail-description">{product.description}</p>

          <div className="product-detail-stock" style={{ marginBottom: 'var(--space-4)' }}>
            {product.stock > 0 ? (
              <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={16} />
                Em estoque ({product.stock} disponíveis)
              </span>
            ) : (
              <span style={{ color: 'var(--color-error)' }}>Esgotado</span>
            )}
          </div>

          {product.stock > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              <span className="text-sm font-medium">Quantidade:</span>
              <div className="qty-control">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
              </div>
            </div>
          )}

          <div className="product-detail-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleAddToCart}
              disabled={product.stock === 0 || addingToCart}
            >
              {addingToCart ? (
                <div className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />
              ) : (
                <>
                  <ShoppingCart size={18} />
                  Adicionar ao Carrinho
                </>
              )}
            </button>

            <button
              className={`btn btn-secondary btn-lg`}
              onClick={handleToggleWishlist}
            >
              <Heart size={18} fill={isFavorited ? 'var(--color-error)' : 'none'} color={isFavorited ? 'var(--color-error)' : 'currentColor'} />
              {isFavorited ? 'Favoritado' : 'Favoritar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
