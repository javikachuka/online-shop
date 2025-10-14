/**
 * Normaliza un texto para búsquedas:
 * - Convierte a minúsculas
 * - Elimina acentos y caracteres especiales
 * - Elimina espacios extra
 * - Mantiene solo letras, números y espacios
 */
export const normalizeSearchText = (text: string): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD') // Descompone caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Elimina los diacríticos (acentos)
    .replace(/[^\w\s]/g, ' ') // Reemplaza caracteres especiales con espacios
    .replace(/\s+/g, ' ') // Elimina espacios múltiples
    .trim();
};

/**
 * Genera variaciones de una palabra para mejorar coincidencias
 */
export const generateSearchVariations = (term: string): string[] => {
  const normalized = normalizeSearchText(term);
  const variations = [normalized];
  
  // Agregar variaciones comunes
  if (normalized.length > 3) {
    // Variación sin la última letra (para plurales)
    variations.push(normalized.slice(0, -1));
    
    // Variación sin las últimas dos letras
    if (normalized.length > 4) {
      variations.push(normalized.slice(0, -2));
    }
  }
  
  return Array.from(new Set(variations)); // Eliminar duplicados
};

/**
 * Calcula la relevancia de un texto respecto a un término de búsqueda
 */
export const calculateRelevance = (text: string, searchTerm: string): number => {
  const normalizedText = normalizeSearchText(text);
  const normalizedSearch = normalizeSearchText(searchTerm);
  
  if (!normalizedText || !normalizedSearch) return 0;
  
  let relevance = 0;
  
  // Coincidencia exacta (mayor peso)
  if (normalizedText === normalizedSearch) {
    relevance += 100;
  }
  
  // Contiene la palabra completa
  if (normalizedText.includes(normalizedSearch)) {
    relevance += 50;
  }
  
  // Comienza con el término
  if (normalizedText.startsWith(normalizedSearch)) {
    relevance += 30;
  }
  
  // Contiene palabras del término
  const searchWords = normalizedSearch.split(' ').filter(word => word.length > 2);
  const textWords = normalizedText.split(' ');
  
  searchWords.forEach(searchWord => {
    textWords.forEach(textWord => {
      if (textWord.includes(searchWord)) {
        relevance += 10;
      }
      if (textWord.startsWith(searchWord)) {
        relevance += 5;
      }
    });
  });
  
  return relevance;
};

/**
 * Crear términos de búsqueda para indexación
 */
export const createSearchIndex = (product: {
  title: string;
  description: string;
  tags: string[];
  categories?: { name: string }[];
  variants?: { attributes?: { attribute: { name: string }; value: { value: string } }[] }[];
}): string => {
  const searchTerms: string[] = [];
  
  // Título del producto
  searchTerms.push(normalizeSearchText(product.title));
  
  // Descripción
  searchTerms.push(normalizeSearchText(product.description));
  
  // Tags
  product.tags.forEach(tag => {
    searchTerms.push(normalizeSearchText(tag));
  });
  
  // Categorías
  product.categories?.forEach(category => {
    searchTerms.push(normalizeSearchText(category.name));
  });
  
  // Atributos de variantes
  product.variants?.forEach(variant => {
    variant.attributes?.forEach(attr => {
      searchTerms.push(normalizeSearchText(attr.attribute.name));
      searchTerms.push(normalizeSearchText(attr.value.value));
    });
  });
  
  // Eliminar duplicados y elementos vacíos
  const uniqueTerms = Array.from(new Set(searchTerms.filter(term => term.length > 0)));
  
  return uniqueTerms.join(' ');
};

/**
 * Construye una consulta SQL para búsqueda de texto completo
 */
export const buildSearchQuery = (searchTerm: string): {
  searchText: string;
  variations: string[];
  sqlQuery: string;
} => {
  const normalizedTerm = normalizeSearchText(searchTerm);
  const variations = generateSearchVariations(normalizedTerm);
  
  // Construir consulta SQL con múltiples condiciones
  const conditions = variations.map(variation => {
    return `(
      LOWER(UNACCENT(title)) LIKE '%${variation}%' OR
      LOWER(UNACCENT(description)) LIKE '%${variation}%' OR
      EXISTS (
        SELECT 1 FROM unnest(tags) as tag 
        WHERE LOWER(UNACCENT(tag)) LIKE '%${variation}%'
      )
    )`;
  });
  
  const sqlQuery = conditions.join(' OR ');
  
  return {
    searchText: normalizedTerm,
    variations,
    sqlQuery
  };
};

/**
 * Validar término de búsqueda
 */
export const validateSearchTerm = (term: string): {
  isValid: boolean;
  message?: string;
  cleanTerm: string;
} => {
  if (!term || typeof term !== 'string') {
    return {
      isValid: false,
      message: 'El término de búsqueda es requerido',
      cleanTerm: ''
    };
  }
  
  const cleanTerm = term.trim();
  
  if (cleanTerm.length < 2) {
    return {
      isValid: false,
      message: 'El término de búsqueda debe tener al menos 2 caracteres',
      cleanTerm
    };
  }
  
  if (cleanTerm.length > 100) {
    return {
      isValid: false,
      message: 'El término de búsqueda es demasiado largo',
      cleanTerm: cleanTerm.substring(0, 100)
    };
  }
  
  return {
    isValid: true,
    cleanTerm
  };
};

/**
 * Destacar términos encontrados en el texto
 */
export const highlightSearchTerms = (text: string, searchTerm: string): string => {
  if (!text || !searchTerm) return text;
  
  const normalizedSearch = normalizeSearchText(searchTerm);
  const words = normalizedSearch.split(' ').filter(word => word.length > 1);
  
  let highlightedText = text;
  
  words.forEach(word => {
    const regex = new RegExp(`(${word})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  });
  
  return highlightedText;
};