

import React, { useState, useMemo } from 'react';
import { Product } from '../../../types';
import { useI18n } from '../../../contexts/I18nContext';
// Fix: Changed named import to default import for GlassCard.
import GlassCard from '../../../components/ui/GlassCard';
import { useSettings } from '../../../contexts/SettingsContext';

/**
 * A memoized component for displaying a single product card.
 * Prevents re-rendering if its props do not change.
 */
const ProductCard: React.FC<{ product: Product; onAddToCart: (product: Product) => void }> = React.memo(({ product, onAddToCart }) => {
    const { settings } = useSettings();
    return (
        <GlassCard
            className="p-3 flex flex-col items-center text-center cursor-pointer hover:shadow-neumorphic-light-inset dark:hover:shadow-neumorphic-dark-inset transition-shadow duration-200"
            onClick={() => onAddToCart(product)}
            aria-label={`Add ${product.name} to cart`}
        >
            <img
                src={product.image || `https://picsum.photos/seed/${product.id}/100`}
                alt={product.name}
                className="w-20 h-20 object-cover rounded-lg mb-2"
                loading="lazy"
            />
            <h3 className="text-sm font-semibold flex-grow">{product.name}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">{product.stock} in stock</p>
            {/* Fix: Use 'priceMinor' and format the currency correctly. */}
            <p className="font-bold mt-1 text-sm">{settings.currency}{(product.priceMinor / 100).toFixed(2)}</p>
        </GlassCard>
    )
});

/**
 * Component responsible for rendering the searchable grid of products.
 */
export const ProductGrid: React.FC<{ products: Product[]; onAddToCart: (product: Product) => void; }> = ({ products, onAddToCart }) => {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => 
    products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())), 
    [products, searchTerm]
  );

  return (
    <div className="flex-1 lg:w-3/5 flex flex-col">
      <input
        type="text"
        placeholder={t('search_products')}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-3 mb-4 bg-white/50 dark:bg-black/50 rounded-lg border-none shadow-neumorphic-light-inset dark:shadow-neumorphic-dark-inset focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={t('search_products')}
      />
      <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredProducts.map(p => (
          <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
        ))}
      </div>
    </div>
  );
};