import { searchProducts, SearchFilters } from '@/actions';
import { SearchPage } from './ui/SearchPage';

interface Props {
  searchParams: {
    q?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    page?: string;
    [key: string]: string | undefined;
  };
}

export default async function Search({ searchParams }: Props) {
  const filters: SearchFilters = {
    query: searchParams.q || '',
    categoryId: searchParams.category,
    minPrice: searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined,
    sortBy: (searchParams.sortBy as any) || 'relevance',
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: 12
  };

  // Extraer filtros de atributos del searchParams
  const attributes: { [key: string]: string[] } = {};
  Object.keys(searchParams).forEach(key => {
    if (key.startsWith('attr_')) {
      const attributeId = key.replace('attr_', '');
      const values = searchParams[key]?.split(',') || [];
      if (values.length > 0) {
        attributes[attributeId] = values;
      }
    }
  });
  
  if (Object.keys(attributes).length > 0) {
    filters.attributes = attributes;
  }

  const searchResult = await searchProducts(filters);

  // Crear una key única basada en los parámetros de búsqueda para forzar re-render
  const searchKey = `${filters.query}-${filters.categoryId}-${filters.minPrice}-${filters.maxPrice}-${filters.sortBy}-${JSON.stringify(filters.attributes)}`;

  return (
    <div className="px-0 sm:px-10">
      <SearchPage 
        key={searchKey}
        initialResult={searchResult}
        initialFilters={filters}
      />
    </div>
  );
}