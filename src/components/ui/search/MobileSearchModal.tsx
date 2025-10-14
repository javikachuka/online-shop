'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IoSearchOutline, IoCloseOutline, IoArrowBackOutline } from 'react-icons/io5';
import { getSearchSuggestions } from '@/actions';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchSuggestion {
  id: string;
  title: string;
  slug: string;
  image: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSearchModal = ({ isOpen, onClose }: Props) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounce para evitar muchas consultas
  const debouncedQuery = useDebounce(query, 300);

  // Efecto para buscar sugerencias
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length >= 2) {
        setLoading(true);
        try {
          const results = await getSearchSuggestions(debouncedQuery, 8); // Más resultados en móvil
          setSuggestions(results);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
      }
      setSelectedIndex(-1);
    };

    if (isOpen) {
      fetchSuggestions();
    }
  }, [debouncedQuery, isOpen]);

  // Enfocar input cuando se abre el modal
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        // Si hay una sugerencia seleccionada, ir al producto
        router.push(`/product/${suggestions[selectedIndex].slug}`);
      } else {
        // Ir a la página de búsqueda
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
      handleClose();
    }
  };

  // Manejar teclas de navegación
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Escape':
        handleClose();
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          router.push(`/product/${suggestions[selectedIndex].slug}`);
          handleClose();
        }
        break;
    }
  };

  // Cerrar modal y limpiar estado
  const handleClose = () => {
    setQuery('');
    setSuggestions([]);
    setSelectedIndex(-1);
    onClose();
  };

  // Manejar clic en sugerencia
  const handleSuggestionClick = (slug: string) => {
    router.push(`/product/${slug}`);
    handleClose();
  };

  // Bloquear scroll cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-gray-200">
          <button
            onClick={handleClose}
            className="mr-3 p-2 -ml-2 hover:bg-gray-100 rounded-full"
          >
            <IoArrowBackOutline className="w-5 h-5 text-gray-700" />
          </button>
          
          <form onSubmit={handleSubmit} className="flex-1">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar productos..."
                className="w-full px-4 py-3 pl-12 pr-12 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />
              <IoSearchOutline className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <IoCloseOutline className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : query.length >= 2 ? (
            suggestions.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion.slug)}
                    className={`w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 ${
                      index === selectedIndex ? 'bg-blue-50' : ''
                    }`}
                  >
                    <img
                      src={suggestion.image}
                      alt={suggestion.title}
                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {suggestion.title}
                      </p>
                    </div>
                  </button>
                ))}
                
                {/* Opción para ver todos los resultados */}
                <button
                  onClick={() => {
                    router.push(`/search?q=${encodeURIComponent(query)}`);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 p-4 text-blue-600 hover:bg-blue-50 border-t-2 border-gray-100"
                >
                  <IoSearchOutline className="w-5 h-5" />
                  <span className="font-medium">
                    Ver todos los resultados para "{query}"
                  </span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <IoSearchOutline className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron productos
                </h3>
                <p className="text-gray-500 text-center mb-4">
                  No hay productos que coincidan con "{query}"
                </p>
                <button
                  onClick={() => {
                    router.push(`/search?q=${encodeURIComponent(query)}`);
                    handleClose();
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
                >
                  Buscar de todas formas
                </button>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <IoSearchOutline className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Buscar productos
              </h3>
              <p className="text-gray-500">
                Escribe al menos 2 caracteres para comenzar la búsqueda
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};