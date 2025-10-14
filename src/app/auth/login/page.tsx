import { titleFont } from '@/config/fonts';
import Link from 'next/link';
import LoginForm from './ui/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen pt-20 sm:pt-22">

      <h1 className={ `${ titleFont.className } text-4xl mb-5` }>Ingresar</h1>

      <LoginForm />
      
    </div>
  );
}