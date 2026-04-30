export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getPaginatedStockVariants } from '@/actions/stock/admin-stock-movements';
import { Pagination, Title } from '@/components';
import { StockAdminPanel } from './ui/StockAdminPanel';

interface Props {
  searchParams: {
    page?: string;
    q?: string;
  };
}

export default async function AdminStockPage({ searchParams }: Props) {
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const query = searchParams.q ?? '';

  const result = await getPaginatedStockVariants(page, 20, query);

  return (
    <>
      <Title title="Gestión de Stock" subtitle="Movimientos y ajustes de inventario" />

      {!result.ok ? (
        <div className="mb-20 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          {result.error || 'No se pudieron cargar los datos de stock'}
        </div>
      ) : (
        <>
          <form className="mb-6 flex gap-2" method="GET">
            <input
              name="q"
              defaultValue={query}
              placeholder="Buscar por producto o SKU"
              className="w-full max-w-xl rounded border p-2"
            />
            <button className="btn-primary" type="submit">
              Buscar
            </button>
          </form>

          <StockAdminPanel variants={result.variants} movements={result.movements} />

          {result.totalPages > 1 && <Pagination totalPages={result.totalPages} />}
        </>
      )}
    </>
  );
}
