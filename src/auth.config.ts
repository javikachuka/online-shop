import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { prisma } from './lib/prisma'; // Usar la instancia singleton
import bcryptjs from 'bcryptjs';
 
export const authConfig = {
  pages: {
    signIn: '/auth/login',
    newUser: '/auth/new-account',
  },
  callbacks: {
    authorized({auth, request: {nextUrl}}) {
      return true
    },
    jwt({token, user}){
      if(user){
        token.data = user
      }
      return token
    },
    session({session, token, user}){
      session.user = token.data as any
      return session
    }
  },
  providers: [
    Credentials({
        async authorize(credentials) {
            const parsedCredentials = z
                .object({ email: z.string().email(), password: z.string().min(8) })
                .safeParse(credentials);
        
            if(!parsedCredentials.success) return null

            const {email, password} = parsedCredentials.data
            
            try {
                // ✅ MEJORADO: Usar la instancia singleton y manejo de errores
                const user = await prisma.user.findUnique({
                    where: {email: email.toLowerCase()}
                })

                if(!user) return null

                if(!bcryptjs.compareSync(password, user.password)) return null

                const {password: _, ...rest} = user
                
                return rest
            } catch (error) {
                console.error('Database error during authentication:', error)
                return null
            }
        },
      }),
  ]
} satisfies NextAuthConfig;

export const {signIn, signOut, auth, handlers} = NextAuth(authConfig)