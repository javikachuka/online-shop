'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IoSearchOutline, IoCloseOutline } from 'react-icons/io5';
import { getSearchSuggestions } from '@/actions';
import { useDebounce } from '@/hooks/useDebounce';
import Image from 'next/image';

interface SearchSuggestion {
  id: string;
  title: string;
  slug: string;
  image: string;
}

export const SearchInput = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Debounce para evitar muchas consultas
  const debouncedQuery = useDebounce(query, 300);

  // Efecto para buscar sugerencias
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length >= 2) {
        setLoading(true);
        try {
          const results = await getSearchSuggestions(debouncedQuery, 5);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      setSelectedIndex(-1);
    };

    fetchSuggestions();
  }, [debouncedQuery]);

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
    if (!showSuggestions || suggestions.length === 0) return;

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
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
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

  // Cerrar sugerencias
  const handleClose = () => {
    setQuery('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Click fuera para cerrar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar productos..."
            className="w-64 px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          
          {query && (
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <IoCloseOutline className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Sugerencias */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((suggestion, index) => (
                <Link
                  key={suggestion.id}
                  href={`/product/${suggestion.slug}`}
                  onClick={handleClose}
                  className={`flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                >
                  <Image
                    src={suggestion.image}
                    alt={suggestion.title}
                    width={48}
                    height={48}
                    className="w-10 h-10 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.title}
                    </p>
                  </div>
                </Link>
              ))}
              
              {/* Opción para ver todos los resultados */}
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={handleClose}
                className="flex items-center gap-2 p-3 text-blue-600 hover:bg-blue-50 border-t border-gray-200"
              >
                <IoSearchOutline className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Ver todos los resultados para &quot;{query}&quot;
                </span>
              </Link>
            </>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No se encontraron productos</p>
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={handleClose}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1 inline-block"
              >
                Buscar de todas formas
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};