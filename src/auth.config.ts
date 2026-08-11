import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from './lib/prisma'; // Usar la instancia singleton
import { EmailService } from './lib/email';
import bcryptjs from 'bcryptjs';
import { randomUUID } from 'crypto';

const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
 
export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  basePath: '/api/auth',
  ...((baseUrl ? { baseUrl } : {})),
  pages: {
    signIn: '/auth/login',
    newUser: '/auth/new-account',
  },
  callbacks: {
    authorized({auth, request: {nextUrl}}) {
      return true
    },
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google') {
        return true;
      }

      const email = user.email?.toLowerCase();
      if (!email) {
        return false;
      }

      const googleProfile = profile as {
        given_name?: string;
        family_name?: string;
        name?: string;
      } | null;

      const fullName = googleProfile?.name?.trim() || '';
      const fallbackFirstName = fullName ? fullName.split(' ')[0] : 'Usuario';
      const fallbackLastName = fullName.includes(' ')
        ? fullName.split(' ').slice(1).join(' ')
        : 'Google';

      const firstName = googleProfile?.given_name?.trim() || fallbackFirstName;
      const lastName = googleProfile?.family_name?.trim() || fallbackLastName;
      const fullDisplayName = `${firstName} ${lastName}`.trim();

      let createdByGoogle = false;

      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser) {
        await prisma.user.update({
          where: { email },
          data: {
            firstName,
            lastName,
            image: user.image || undefined,
            emailVerified: new Date(),
          },
        });
      } else {
        try {
          await prisma.user.create({
            data: {
              email,
              firstName,
              lastName,
              // Password placeholder because local schema requires non-null password.
              password: bcryptjs.hashSync(randomUUID()),
              image: user.image,
              emailVerified: new Date(),
            },
          });
          createdByGoogle = true;
        } catch (error) {
          // If another request created the user in parallel, update profile data instead.
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            await prisma.user.update({
              where: { email },
              data: {
                firstName,
                lastName,
                image: user.image || undefined,
                emailVerified: new Date(),
              },
            });
          } else {
            throw error;
          }
        }
      }

      if (createdByGoogle) {
        try {
          const emailService = EmailService.getInstance();
          await emailService.sendWelcomeEmail(email, fullDisplayName || 'Usuario');
        } catch (emailError) {
          console.error('Error sending welcome email after Google sign-in:', emailError);
        }
      }

      return true;
    },
    async jwt({token, user}){
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email.toLowerCase() }
        })

        if (dbUser) {
          const { password: _, ...rest } = dbUser
          token.data = rest
          return token
        }
      }

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
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
    }),
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