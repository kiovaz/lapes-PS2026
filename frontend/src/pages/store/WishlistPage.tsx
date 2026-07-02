import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, BookOpen } from 'lucide-react';
import { wishlistApi } from '../../api/wishlist';
import { cartApi } from '../../api/cart';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency, toNumber } from '../../utils/formatters';
import type { WishlistItem } from '../../types';

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshCart } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchWishlist = async () => {
    try {
      const data = await wishlistApi.findAll();
      setItems(data);
    } catch {
      addToast('Erro ao carregar favoritos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWishlist(); }, []);

  const handleRemove = async (productId: number) => {
    try {
      await wishlistApi.remove(productId);
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      addToast('Removido dos favoritos', 'info');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro', 'error');
    }
  };

  const handleAddToCart = async (productId: number) => {
    try {
      await cartApi.addItem({ productId, quantity: 1 });
      await refreshCart();
      addToast('Adicionado ao carrinho!', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erro', 'error');
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <Heart size={48} className="empty-state-icon" />
        <h3 className="empty-state-title">Nenhum favorito</h3>
        <p className="empty-state-description">Salve livros que você gostaria de comprar depois.</p>
        <Link to="/" className="btn btn-primary">Explorar catálogo</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Favoritos</h1>
        <p>{items.length} {items.length === 1 ? 'livro salvo' : 'livros salvos'}</p>
      </div>

      <div className="product-grid">
        {items.map((item) => (
          <div key={item.id} className="product-card" onClick={() => navigate(`/products/${item.productId}`)}>
            <div className="product-card-image-wrapper">
              {item.product.image ? (
                <img src={item.product.image} alt={item.product.name} className="product-card-image" loading="lazy" />
              ) : (
                <div className="product-card-image-placeholder">
                  <BookOpen size={32} />
                </div>
              )}
              <div className="product-card-actions">
                <button className="wishlist-btn active" onClick={(e) => { e.stopPropagation(); handleRemove(item.productId); }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="product-card-body">
              <div className="product-card-category">{item.product.category}</div>
              <div className="product-card-name">{item.product.name}</div>
              <div className="product-card-footer">
                <span className="product-card-price">{formatCurrency(toNumber(item.product.price))}</span>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={(e) => { e.stopPropagation(); handleAddToCart(item.productId); }}
                  disabled={item.product.stock === 0}
                  style={{ fontSize: '11px' }}
                >
                  <ShoppingCart size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
