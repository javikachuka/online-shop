import { Title } from '@/components';
import { AddressForm } from './ui/AddressForm';
import { getCountries, getDefaultCompany, getUserAddress } from '@/actions';
import { auth } from '@/auth.config';

export default async function NamePage() {
  // Middleware garantiza autenticación
  const session = (await auth())!;

  const countries = await getCountries()

  const company = await getDefaultCompany()

  const userAddress = await getUserAddress(session.user!.id) ?? undefined

  return (
    <div className="flex flex-col sm:justify-center sm:items-center mb-72 px-4 sm:px-0">

      <div className="w-full  xl:w-[1000px] flex flex-col justify-center text-left">
        
        <Title title="Dirección" subtitle="Dirección de entrega y facturación" />

        <AddressForm countries={countries} userStoredAddress={userAddress} company={company} />

      </div>

    </div>
  );
}