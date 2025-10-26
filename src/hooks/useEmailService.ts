import { useState } from 'react';
import { 
  requestPasswordReset, 
  sendWelcomeEmail, 
  sendOrderConfirmationEmail 
} from '@/actions/auth/password-reset';

interface EmailState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

export function useEmailService() {
  const [passwordResetState, setPasswordResetState] = useState<EmailState>({
    isLoading: false,
    error: null,
    success: null
  });

  const [welcomeEmailState, setWelcomeEmailState] = useState<EmailState>({
    isLoading: false,
    error: null,
    success: null
  });

  const [orderEmailState, setOrderEmailState] = useState<EmailState>({
    isLoading: false,
    error: null,
    success: null
  });

  // Reset state function
  const resetState = (type: 'passwordReset' | 'welcome' | 'order') => {
    const initialState = { isLoading: false, error: null, success: null };
    
    switch (type) {
      case 'passwordReset':
        setPasswordResetState(initialState);
        break;
      case 'welcome':
        setWelcomeEmailState(initialState);
        break;
      case 'order':
        setOrderEmailState(initialState);
        break;
    }
  };

  // Request password reset
  const requestPasswordResetEmail = async (email: string) => {
    setPasswordResetState({ isLoading: true, error: null, success: null });
    
    try {
      const result = await requestPasswordReset(email);
      
      if (result.ok) {
        setPasswordResetState({
          isLoading: false,
          error: null,
          success: result.message
        });
      } else {
        setPasswordResetState({
          isLoading: false,
          error: result.message,
          success: null
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Ocurrió un error inesperado';
      setPasswordResetState({
        isLoading: false,
        error: errorMessage,
        success: null
      });
      
      return { ok: false, message: errorMessage };
    }
  };

  // Send welcome email
  const sendWelcomeEmailToUser = async (userId: string) => {
    setWelcomeEmailState({ isLoading: true, error: null, success: null });
    
    try {
      const result = await sendWelcomeEmail(userId);
      
      if (result.ok) {
        setWelcomeEmailState({
          isLoading: false,
          error: null,
          success: result.message
        });
      } else {
        setWelcomeEmailState({
          isLoading: false,
          error: result.message,
          success: null
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Error enviando email de bienvenida';
      setWelcomeEmailState({
        isLoading: false,
        error: errorMessage,
        success: null
      });
      
      return { ok: false, message: errorMessage };
    }
  };

  // Send order confirmation email
  const sendOrderConfirmationEmailToUser = async (orderId: string) => {
    setOrderEmailState({ isLoading: true, error: null, success: null });
    
    try {
      const result = await sendOrderConfirmationEmail(orderId);
      
      if (result.ok) {
        setOrderEmailState({
          isLoading: false,
          error: null,
          success: result.message
        });
      } else {
        setOrderEmailState({
          isLoading: false,
          error: result.message,
          success: null
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Error enviando email de confirmación';
      setOrderEmailState({
        isLoading: false,
        error: errorMessage,
        success: null
      });
      
      return { ok: false, message: errorMessage };
    }
  };

  return {
    // Estados
    passwordReset: passwordResetState,
    welcomeEmail: welcomeEmailState,
    orderEmail: orderEmailState,
    
    // Acciones
    requestPasswordResetEmail,
    sendWelcomeEmailToUser,
    sendOrderConfirmationEmailToUser,
    resetState,
    
    // Utilidades
    isAnyLoading: passwordResetState.isLoading || welcomeEmailState.isLoading || orderEmailState.isLoading,
  };
}