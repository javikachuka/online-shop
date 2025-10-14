'use server';
 
import { auth, signIn } from '@/auth.config';
import { AuthError } from 'next-auth';
 
// ...
 
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {    
    await signIn('credentials', {
        ...Object.fromEntries(formData),
        redirect: false
    });
    return 'Success'
  } catch (error) {
    console.log(error);
    
    if (error instanceof AuthError) {
        console.log(error);
        
      // Verificar si es un error de credenciales basado en el mensaje
      if (error.message?.includes('CredentialsSignin')) {
        return 'CredentialsSignin';
      }
      return 'Something went wrong.';
    }
    throw error;
  }
}


export const login = async (email: string, password: string) => {

  try {

    await signIn('credentials', {email, password})

    return {ok: true}
    
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      message: 'no se pudo iniciar session'
    }
    
  }
}

export const isLoggedAdmin = async () => {
  try {
    const session = await auth();
    if(session?.user && session.user?.role === 'admin'){
      return true;
    }

    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
}