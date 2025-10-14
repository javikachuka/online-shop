export interface Company {
  id: string;
  name: string;
  slug: string;
  tradeName?: string | null;
  
  // Información legal
  cuit?: string | null;
  taxId?: string | null;
  legalAddress?: string | null;
  businessType?: string | null;
  
  // Información de contacto
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  
  // Branding
  logo?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  description?: string | null;
  
  // Datos bancarios para transferencias
  bankName?: string | null;
  accountHolder?: string | null;
  cbu?: string | null;
  cvu?: string | null;
  alias?: string | null;
  iban?: string | null;
  swift?: string | null;
  accountNumber?: string | null;
  accountType?: string | null;
  
  // Configuración general
  isActive: boolean;
  isDefault: boolean;
  currency: string;
  timezone: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Interface para crear una nueva empresa
export interface CreateCompanyInput {
  name: string;
  slug: string;
  tradeName?: string;
  
  // Información legal
  cuit?: string;
  taxId?: string;
  legalAddress?: string;
  businessType?: string;
  
  // Información de contacto
  email?: string;
  phone?: string;
  website?: string;
  
  // Branding
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  description?: string;
  
  // Datos bancarios
  bankName?: string;
  accountHolder?: string;
  cbu?: string;
  cvu?: string;
  alias?: string;
  iban?: string;
  swift?: string;
  accountNumber?: string;
  accountType?: string;
  
  // Configuración
  isActive?: boolean;
  isDefault?: boolean;
  currency?: string;
  timezone?: string;
}

// Interface para actualizar empresa
export interface UpdateCompanyInput extends Partial<CreateCompanyInput> {
  id: string;
}

// Interface para datos bancarios específicos
export interface CompanyBankingInfo {
  bankName?: string;
  accountHolder?: string;
  cbu?: string;
  cvu?: string;
  alias?: string;
  iban?: string;
  swift?: string;
  accountNumber?: string;
  accountType?: string;
}

// Interface para configuración de branding
export interface CompanyBranding {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  description?: string;
}

// Interface para información legal
export interface CompanyLegalInfo {
  cuit?: string;
  taxId?: string;
  legalAddress?: string;
  businessType?: string;
}

// Interface para configuración general
export interface CompanySettings {
  isActive: boolean;
  isDefault: boolean;
  currency: string;
  timezone: string;
}