'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Company, CreateCompanyInput, UpdateCompanyInput } from '@/interfaces';
import { createCompany, updateCompany } from '@/actions';
import { 
  IoBusinessOutline, 
  IoDocumentTextOutline, 
  IoCallOutline, 
  IoColorPaletteOutline, 
  IoCardOutline,
  IoSettingsOutline,
  IoSaveOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline
} from 'react-icons/io5';
import { toast, Toaster } from 'sonner';

interface CompanyFormProps {
  company?: Company | null;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({ company }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState<CreateCompanyInput>({
    name: company?.name || '',
    slug: company?.slug || '',
    tradeName: company?.tradeName || '',
    
    // Información legal
    cuit: company?.cuit || '',
    taxId: company?.taxId || '',
    legalAddress: company?.legalAddress || '',
    businessType: company?.businessType || '',
    
    // Información de contacto
    email: company?.email || '',
    phone: company?.phone || '',
    website: company?.website || '',
    
    // Branding
    logo: company?.logo || '',
    primaryColor: company?.primaryColor || '#3B82F6',
    secondaryColor: company?.secondaryColor || '#1F2937',
    description: company?.description || '',
    
    // Datos bancarios
    bankName: company?.bankName || '',
    accountHolder: company?.accountHolder || '',
    cbu: company?.cbu || '',
    cvu: company?.cvu || '',
    alias: company?.alias || '',
    iban: company?.iban || '',
    swift: company?.swift || '',
    accountNumber: company?.accountNumber || '',
    accountType: company?.accountType || '',
    
    // Configuración
    isActive: company?.isActive ?? true,
    isDefault: company?.isDefault ?? false,
    currency: company?.currency || 'ARS',
    timezone: company?.timezone || 'America/Argentina/Buenos_Aires'
  });

  const handleInputChange = (field: keyof CreateCompanyInput, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    handleInputChange('name', name);
    if (!company) { // Solo auto-generar slug para empresas nuevas
      handleInputChange('slug', generateSlug(name));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let result;
      
      if (company) {
        // Actualizar empresa existente
        const updateData: UpdateCompanyInput = {
          id: company.id,
          ...formData
        };
        result = await updateCompany(updateData);
      } else {
        // Crear nueva empresa
        result = await createCompany(formData);
      }

      if (result.ok) {
        setMessage({
          text: result.message || (company ? 'Empresa actualizada exitosamente' : 'Empresa creada exitosamente'),
          type: 'success'
        });
        toast.success(`Empresa actualizada exitosamente`);
        router.refresh();
      } else {
        setMessage({
          text: result.message || 'Error al procesar la solicitud',
          type: 'error'
        });
        toast.error(`Error al procesar la solicitud`);

      }
    } catch (error) {
      setMessage({
        text: 'Error inesperado al procesar la solicitud',
        type: 'error'
      });
    toast.error(`Error inesperado al procesar la solicitud`);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Mensaje de resultado */}
        {message && (
          <div className={`flex items-center gap-2 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <IoCheckmarkCircleOutline className="w-5 h-5" />
            ) : (
              <IoAlertCircleOutline className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Información Básica */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <IoBusinessOutline className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Empresa *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL) *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Comercial
              </label>
              <input
                type="text"
                value={formData.tradeName}
                onChange={(e) => handleInputChange('tradeName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Información Legal */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <IoDocumentTextOutline className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Información Legal</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CUIT/CUIL
              </label>
              <input
                type="text"
                value={formData.cuit}
                onChange={(e) => handleInputChange('cuit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="XX-XXXXXXXX-X"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Fiscal (otros países)
              </label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => handleInputChange('taxId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Negocio
              </label>
              <select
                value={formData.businessType}
                onChange={(e) => handleInputChange('businessType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar...</option>
                <option value="SA">Sociedad Anónima (SA)</option>
                <option value="SRL">Sociedad de Responsabilidad Limitada (SRL)</option>
                <option value="Monotributo">Monotributo</option>
                <option value="Responsable Inscripto">Responsable Inscripto</option>
                <option value="Exento">Exento</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domicilio Legal
              </label>
              <input
                type="text"
                value={formData.legalAddress}
                onChange={(e) => handleInputChange('legalAddress', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <IoCallOutline className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Información de Contacto</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sitio Web
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <IoColorPaletteOutline className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Branding</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL del Logo
              </label>
              <input
                type="url"
                value={formData.logo}
                onChange={(e) => handleInputChange('logo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color Primario
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color Secundario
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Datos Bancarios */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <IoCardOutline className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Datos Bancarios</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Banco
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titular de la Cuenta
              </label>
              <input
                type="text"
                value={formData.accountHolder}
                onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CBU (Argentina)
              </label>
              <input
                type="text"
                value={formData.cbu}
                onChange={(e) => handleInputChange('cbu', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="XXXXXXXXXXXXXXXXXXXXXXXX"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVU (Argentina)
              </label>
              <input
                type="text"
                value={formData.cvu}
                onChange={(e) => handleInputChange('cvu', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="XXXXXXXXXXXXXXXXXXXXXXXX"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alias Bancario
              </label>
              <input
                type="text"
                value={formData.alias}
                onChange={(e) => handleInputChange('alias', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Cuenta
              </label>
              <select
                value={formData.accountType}
                onChange={(e) => handleInputChange('accountType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar...</option>
                <option value="corriente">Cuenta Corriente</option>
                <option value="ahorro">Caja de Ahorro</option>
                <option value="especial">Cuenta Especial</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IBAN (Internacional)
              </label>
              <input
                type="text"
                value={formData.iban}
                onChange={(e) => handleInputChange('iban', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código SWIFT
              </label>
              <input
                type="text"
                value={formData.swift}
                onChange={(e) => handleInputChange('swift', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Cuenta (Genérico)
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Configuración General */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <IoSettingsOutline className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Configuración General</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ARS">Peso Argentino (ARS)</option>
                <option value="USD">Dólar Estadounidense (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="BRL">Real Brasileño (BRL)</option>
                <option value="UYU">Peso Uruguayo (UYU)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zona Horaria
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="America/Argentina/Buenos_Aires">Buenos Aires (UTC-3)</option>
                <option value="America/Santiago">Santiago (UTC-3)</option>
                <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
                <option value="America/Montevideo">Montevideo (UTC-3)</option>
                <option value="America/New_York">Nueva York (UTC-5)</option>
                <option value="Europe/Madrid">Madrid (UTC+1)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Empresa Activa
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                  Empresa por Defecto
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="flex justify-end pt-6 border-t">
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
          >
            <IoSaveOutline className="w-5 h-5" />
            {loading ? 'Guardando...' : (company ? 'Actualizar Empresa' : 'Crear Empresa')}
          </button>
        </div>
      </form>
      <Toaster
            position="bottom-right"
        />
    </div>
  );
};