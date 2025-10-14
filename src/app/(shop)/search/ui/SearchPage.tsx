'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  IoSearchOutline, 
  IoFunnelOutline, 
  IoGridOutline,
  IoListOutline,
  IoChevronDownOutline,
  IoCloseOutline,
  IoStarOutline
} from 'react-icons/io5';
import { SearchResult, SearchFilters } from '@/actions';
import { ProductGrid, ProductList } from '@/components';

interface Props {
  initialResult: SearchResult;
  initialFilters: SearchFilters;
}

export const SearchPage = ({ initialResult, initialFilters }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [result, setResult] = useState(initialResult);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Efecto para actualizar estado cuando cambien las props iniciales
  useEffect(() => {
    setResult(initialResult);
    setFilters(initialFilters);
  }, [initialResult, initialFilters]);

  // Actualizar URL cuando cambien los filtros
  const updateURL = (newFilters: SearchFilters) => {
    const params = new URLSearchParams();
    
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.categoryId) params.set('category', newFilters.categoryId);
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice.toString());
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice.toString());
    if (newFilters.sortBy && newFilters.sortBy !== 'relevance') params.set('sortBy', newFilters.sortBy);
    if (newFilters.page && newFilters.page > 1) params.set('page', newFilters.page.toString());
    
    // Agregar filtros de atributos
    if (newFilters.attributes) {
      Object.entries(newFilters.attributes).forEach(([attrId, values]) => {
        if (values.length > 0) {
          params.set(`attr_${attrId}`, values.join(','));
        }
      });
    }
    
    router.push(`/search?${params.toString()}`);
  };

  // Manejar cambio de filtros
  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    updateURL(updatedFilters);
  };

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    const updatedFilters = { ...filters, page };
    setFilters(updatedFilters);
    updateURL(updatedFilters);
  };

  // Limpiar filtros
  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      query: filters.query,
      sortBy: 'relevance',
      page: 1,
      limit: 12
    };
    setFilters(clearedFilters);
    updateURL(clearedFilters);
  };

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.categoryId) count++;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    if (filters.attributes && Object.keys(filters.attributes).length > 0) {
      count += Object.values(filters.attributes).reduce((acc, values) => acc + values.length, 0);
    }
    return count;
  }, [filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de búsqueda */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Información de búsqueda */}
          <div className="mb-4">
            {result.searchInfo.query ? (
              <h1 className="text-2xl font-bold text-gray-900">
                Resultados para &quot;{result.searchInfo.query}&quot;
              </h1>
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">
                Todos los productos
              </h1>
            )}
            <p className="text-gray-600 mt-1">
              {result.total} productos encontrados
              {result.searchInfo.executionTime && (
                <span className="text-sm"> • {result.searchInfo.executionTime}ms</span>
              )}
            </p>
          </div>

          {/* Controles */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Botones de filtros y vista */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilters || activeFiltersCount > 0
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <IoFunnelOutline className="w-4 h-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Limpiar filtros
                </button>
              )}

              {/* Cambio de vista */}
              <div className="flex border rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Vista en cuadrícula"
                >
                  <IoGridOutline className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Vista en lista"
                >
                  <IoListOutline className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Ordenamiento */}
            <div className="flex items-center gap-2">
              <span className="text-gray-700 text-sm">Ordenar por:</span>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="relevance">Relevancia</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="newest">Más recientes</option>
                <option value="name">Nombre A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Panel de filtros */}
          {showFilters && (
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg border p-6 sticky top-6">
                <h3 className="font-semibold text-gray-900 mb-4">Filtros</h3>

                {/* Filtro por categoría */}
                {result.filters.categories.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Categorías</h4>
                    <div className="space-y-2">
                      {result.filters.categories.map(category => (
                        <label key={category.id} className="flex items-center">
                          <input
                            type="radio"
                            name="category"
                            checked={filters.categoryId === category.id}
                            onChange={(e) => handleFilterChange({ 
                              categoryId: e.target.checked ? category.id : undefined 
                            })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">
                            {category.name} ({category.count})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filtro por precio */}
                {result.filters.priceRange.max > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Precio</h4>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Mín"
                          value={filters.minPrice || ''}
                          onChange={(e) => handleFilterChange({ 
                            minPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Máx"
                          value={filters.maxPrice || ''}
                          onChange={(e) => handleFilterChange({ 
                            maxPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Rango: ${result.filters.priceRange.min} - ${result.filters.priceRange.max}
                      </p>
                    </div>
                  </div>
                )}

                {/* Filtros por atributos */}
                {result.filters.attributes.map(attribute => (
                  <div key={attribute.id} className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">{attribute.name}</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {attribute.values.map(value => (
                        <label key={value.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.attributes?.[attribute.id]?.includes(value.id) || false}
                            onChange={(e) => {
                              const currentValues = filters.attributes?.[attribute.id] || [];
                              const newValues = e.target.checked
                                ? [...currentValues, value.id]
                                : currentValues.filter(id => id !== value.id);
                              
                              const newAttributes = { ...filters.attributes };
                              if (newValues.length > 0) {
                                newAttributes[attribute.id] = newValues;
                              } else {
                                delete newAttributes[attribute.id];
                              }
                              
                              handleFilterChange({ attributes: newAttributes });
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">
                            {value.value} ({value.count})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contenido principal */}
          <div className="flex-1">
            {result.products.length > 0 ? (
              <>
                {/* Grid o Lista de productos */}
                {viewMode === 'grid' ? (
                  <ProductGrid products={result.products} />
                ) : (
                  <ProductList products={result.products} />
                )}

                {/* Paginación */}
                {result.totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-2">
                      {/* Página anterior */}
                      {result.page > 1 && (
                        <button
                          onClick={() => handlePageChange(result.page - 1)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Anterior
                        </button>
                      )}

                      {/* Números de página */}
                      {Array.from({ length: Math.min(5, result.totalPages) }, (_, i) => {
                        const page = Math.max(1, result.page - 2) + i;
                        if (page > result.totalPages) return null;
                        
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 border rounded-lg ${
                              page === result.page
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}

                      {/* Página siguiente */}
                      {result.page < result.totalPages && (
                        <button
                          onClick={() => handlePageChange(result.page + 1)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Siguiente
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Sin resultados */
              <div className="text-center py-12">
                <IoSearchOutline className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No se encontraron productos
                </h3>
                <p className="text-gray-600 mb-4">
                  {result.searchInfo.query 
                    ? `No hay productos que coincidan con "${result.searchInfo.query}"`
                    : 'No hay productos disponibles con los filtros seleccionados'
                  }
                </p>
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Limpiar filtros y ver todos los productos
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};