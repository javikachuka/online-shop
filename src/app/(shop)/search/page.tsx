import { searchProducts, SearchFilters } from '@/actions';
import { SearchPage } from './ui/SearchPage';

interface Props {
  searchParams: Promise<{
    q?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    page?: string;
    [key: string]: string | undefined;
  }>;
}

export default async function Search({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;

  const filters: SearchFilters = {
    query: resolvedSearchParams.q || '',
    categoryId: resolvedSearchParams.category,
    minPrice: resolvedSearchParams.minPrice ? parseFloat(resolvedSearchParams.minPrice) : undefined,
    maxPrice: resolvedSearchParams.maxPrice ? parseFloat(resolvedSearchParams.maxPrice) : undefined,
    sortBy: (resolvedSearchParams.sortBy as any) || 'relevance',
    page: resolvedSearchParams.page ? parseInt(resolvedSearchParams.page) : 1,
    limit: 12
  };

  // Extraer filtros de atributos del searchParams
  const attributes: { [key: string]: string[] } = {};
  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (key.startsWith('attr_')) {
      const attributeId = key.replace('attr_', '');
      const values = value?.split(',') || [];
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