'use client';

import { useState } from 'react';
import { IoLogoWhatsapp, IoClose } from 'react-icons/io5';

interface Props {
  phoneNumber: string;
  message?: string;
  position?: 'bottom-right' | 'bottom-left';
}

export const WhatsAppFloat = ({ 
  phoneNumber, 
  message = "Hola! Tengo una consulta sobre sus productos", 
  position = 'bottom-right' 
}: Props) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed ${positionClasses[position]} z-50 group`}>
      {/* Botón principal */}
      <div className="relative">
        <button
          onClick={handleWhatsAppClick}
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 flex items-center justify-center group-hover:rounded-l-full group-hover:pr-16"
          aria-label="Contactar por WhatsApp"
        >
          <IoLogoWhatsapp className="text-2xl" />
          
          {/* Texto que aparece al hover */}
          <span className="absolute right-16 bg-green-500 text-white px-3 py-2 rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm font-medium">
            ¿Necesitas ayuda?
          </span>
        </button>

        {/* Botón de cerrar (opcional) */}
        {/* <button
          onClick={() => setIsVisible(false)}
          className="absolute -top-2 -right-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          aria-label="Cerrar"
        >
          <IoClose className="text-xs" />
        </button> */}

        {/* Animación de pulso */}
        {/* <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div> */}
      </div>
    </div>
  );
};