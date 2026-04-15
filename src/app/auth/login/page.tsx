import { titleFont } from '@/config/fonts';
import Link from 'next/link';
import LoginForm from './ui/LoginForm';
import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';

interface Props {
  searchParams: {
    redirectTo?: string;
  };
}

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  const rawRedirectTo = searchParams.redirectTo ?? '/';
  const redirectTo = rawRedirectTo.startsWith('/') && !rawRedirectTo.startsWith('//')
    ? rawRedirectTo
    : '/';

  if (session?.user) {
    redirect(redirectTo);
  }

  return (
    <div className="flex flex-col min-h-screen pt-20 sm:pt-22">

      <h1 className={ `${ titleFont.className } text-4xl mb-5` }>Ingresar</h1>

      <LoginForm />
      
    </div>
  );
}