import { useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Edit, SlidersHorizontal, X } from 'lucide-react';
import { products, categories } from '../data/products';
import { useAuth } from '../context/AuthContext';

export function Catalog() {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [sortBy, setSortBy] = useState('default');
  const [showOffers, setShowOffers] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
const [showCategories, setShowCategories] = useState(true);
  const { user } = useAuth();

  const customProducts = JSON.parse(localStorage.getItem('customProducts') || '[]');
  const allProducts = [...products, ...customProducts];

  const filteredProducts = allProducts
    .filter((product) => {
      const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.artisan.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      const matchesOffers = !showOffers || product.stock <= 5;
      return matchesCategory && matchesSearch && matchesPrice && matchesOffers;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const isArtisan = user?.role === 'artisan';
  const canEditProduct = (product: any) => isArtisan && product.createdBy === user?.id;

  const getStockLabel = (stock: number) => {
    if (stock === 0) return { label: 'Agotado', color: 'bg-red-100 text-red-700' };
    if (stock <= 3) return { label: `¡Solo ${stock}!`, color: 'bg-red-100 text-red-700' };
    if (stock <= 10) return { label: 'Poco stock', color: 'bg-yellow-100 text-yellow-700' };
    return null;
  };

  return (
    <div className="py-8 bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl mb-2">Catálogo de Productos</h1>
          <p className="text-gray-600">Explora nuestra colección de productos artesanales únicos</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Buscar productos, artesanos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="default">Ordenar por</option>
            <option value="price-asc">Precio: Menor a Mayor</option>
            <option value="price-desc">Precio: Mayor a Menor</option>
            <option value="name">Nombre A-Z</option>
          </select>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </Button>
        </div>

        <div className="flex gap-6">
          {/* Panel lateral de filtros */}
          {showFilters && (
            <div className="w-64 flex-shrink-0 space-y-6">

{/* Categorías */}
<div className="bg-white rounded-xl p-4 shadow-sm">
  <button
    onClick={() => setShowCategories(!showCategories)}
    className="w-full flex justify-between items-center font-semibold text-gray-800"
  >
    Categorías
    <span>{showCategories ? '▲' : '▼'}</span>
  </button>
  {showCategories && (
    <div className="space-y-1 mt-3">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => setSelectedCategory(category)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedCategory === category
              ? 'bg-orange-100 text-orange-700 font-medium'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  )}
</div>

              {/* Rango de precios */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold mb-3 text-gray-800">Rango de Precio</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>${priceRange[0].toLocaleString('es-CO')}</span>
                    <span>${priceRange[1].toLocaleString('es-CO')}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000000"
                    step="10000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full accent-orange-600"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Mín"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Máx"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000000])}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Ofertas */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold mb-3 text-gray-800">Ofertas</h3>
                <button
                  onClick={() => setShowOffers(!showOffers)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    showOffers ? 'bg-orange-100 text-orange-700 font-medium' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  🏷️ Últimas unidades
                </button>
              </div>

              {/* Limpiar filtros */}
              <Button
                variant="outline"
                className="w-full text-gray-600"
                onClick={() => {
                  setSelectedCategory('Todos');
                  setPriceRange([0, 1000000]);
                  setShowOffers(false);
                  setSearchQuery('');
                  setSortBy('default');
                }}
              >
                <X className="h-4 w-4 mr-2" /> Limpiar Filtros
              </Button>
            </div>
          )}

          {/* Grid de productos */}
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-4">{filteredProducts.length} productos encontrados</p>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No se encontraron productos</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const stockLabel = getStockLabel(product.stock);
                  return (
                    <div key={product.id} className="relative group">
                      <Link to={`/producto/${product.id}`}>
                        <Card className={`overflow-hidden hover:shadow-lg transition-shadow h-full ${product.stock === 0 ? 'opacity-70' : ''}`}>
                          <div className="relative">
                            <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                            {stockLabel && (
                              <span className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-full font-medium ${stockLabel.color}`}>
                                {stockLabel.label}
                              </span>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <div className="mb-2">
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                {product.category}
                              </span>
                            </div>
                            <h3 className="font-semibold mb-1 line-clamp-1">{product.name}</h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-orange-600 font-semibold text-lg">
                                ${product.price.toLocaleString('es-CO')}
                              </span>
                              {product.stock === 0 && (
                                <span className="text-xs text-red-600 font-medium">Agotado</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Por {product.artisan}</p>
                          </CardContent>
                        </Card>
                      </Link>
                      {canEditProduct(product) && (
                        <Link to={`/producto/editar/${product.id}`}>
                          <Button size="sm" className="absolute top-2 right-2 bg-white hover:bg-gray-100 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}