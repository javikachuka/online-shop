import { redirect } from 'next/navigation';
import { getDefaultCompany } from '@/actions';
import { CompanyForm } from './ui/CompanyForm';

export default async function CompanyPage() {
  // Obtener la empresa por defecto para editarla
  const company = await getDefaultCompany();

  return (
    <div className="px-0 sm:px-10">
      <div className="w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold">
            {company ? 'Configuración de Empresa' : 'Crear Empresa'}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <CompanyForm company={company} />
        </div>
      </div>
    </div>
  );
}