'use server';

import {prisma} from '@/lib/prisma';
import { Company, CreateCompanyInput, UpdateCompanyInput } from '@/interfaces';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';

// Obtener la empresa por defecto o la primera empresa disponible
export const getDefaultCompany = async (): Promise<Company | null> => {
  try {
    const company = await prisma.company.findFirst({
      where: {
        OR: [
          { isDefault: true },
          { isActive: true }
        ]
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    return company;
  } catch (error) {
    console.error('Error fetching default company:', error);
    return null;
  }
};

// Obtener todas las empresas
export const getAllCompanies = async (): Promise<Company[]> => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    });

    return companies;
  } catch (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
};

// Obtener empresa por ID
export const getCompanyById = async (id: string): Promise<Company | null> => {
  try {
    const company = await prisma.company.findUnique({
      where: { id }
    });

    return company;
  } catch (error) {
    console.error('Error fetching company by ID:', error);
    return null;
  }
};

// Obtener empresa por slug
export const getCompanyBySlug = async (slug: string): Promise<Company | null> => {
  try {
    const company = await prisma.company.findUnique({
      where: { slug }
    });

    return company;
  } catch (error) {
    console.error('Error fetching company by slug:', error);
    return null;
  }
};

// Crear nueva empresa
export const createCompany = async (data: CreateCompanyInput) => {
  try {
    // Si es la primera empresa o se marca como default, desactivar otros defaults
    if (data.isDefault) {
      await prisma.company.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    // Si no hay empresas, esta será la default automáticamente
    const companyCount = await prisma.company.count();
    const shouldBeDefault = companyCount === 0 || data.isDefault;

    const company = await prisma.company.create({
      data: {
        ...data,
        isDefault: shouldBeDefault,
        isActive: data.isActive ?? true,
        currency: data.currency ?? 'ARS',
        timezone: data.timezone ?? 'America/Argentina/Buenos_Aires'
      }
    });

    revalidatePath('/admin/company');
    revalidatePath('/');
    
    return {
      ok: true,
      company,
      message: 'Empresa creada exitosamente'
    };
  } catch (error) {
    console.error('Error creating company:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return {
        ok: false,
        message: 'Ya existe una empresa con ese slug'
      };
    }

    return {
      ok: false,
      message: 'Error al crear la empresa'
    };
  }
};

// Actualizar empresa
export const updateCompany = async (data: UpdateCompanyInput) => {
  try {
    const { id, ...updateData } = data;

    // Si se marca como default, desactivar otros defaults
    if (updateData.isDefault) {
      await prisma.company.updateMany({
        where: { 
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }

    const company = await prisma.company.update({
      where: { id },
      data: updateData
    });

    // ✅ Revalidar múltiples rutas específicas y layouts
    revalidatePath('/admin/company');
    revalidatePath('/', 'layout'); // Específicamente el layout
    revalidatePath('/');
    revalidatePath('/cart');
    revalidatePath('/checkout');
    revalidatePath('/profile');
    
    return {
      ok: true,
      company,
      message: 'Empresa actualizada exitosamente'
    };
  } catch (error) {
    console.error('Error updating company:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return {
        ok: false,
        message: 'Ya existe una empresa con ese slug'
      };
    }

    return {
      ok: false,
      message: 'Error al actualizar la empresa'
    };
  }
};

// Eliminar empresa
export const deleteCompany = async (id: string) => {
  try {
    // Verificar que no sea la única empresa
    const companyCount = await prisma.company.count();
    if (companyCount <= 1) {
      return {
        ok: false,
        message: 'No se puede eliminar la única empresa del sistema'
      };
    }

    // Verificar que no tenga órdenes asociadas
    const ordersCount = await prisma.order.count({
      where: { companyId: id }
    });

    if (ordersCount > 0) {
      return {
        ok: false,
        message: 'No se puede eliminar una empresa que tiene órdenes asociadas'
      };
    }

    await prisma.company.delete({
      where: { id }
    });

    // Si era la empresa default, marcar otra como default
    const remainingCompanies = await prisma.company.findMany({
      where: { isDefault: true }
    });

    if (remainingCompanies.length === 0) {
      const firstCompany = await prisma.company.findFirst({
        where: { isActive: true }
      });

      if (firstCompany) {
        await prisma.company.update({
          where: { id: firstCompany.id },
          data: { isDefault: true }
        });
      }
    }

    revalidatePath('/admin/company');
    
    return {
      ok: true,
      message: 'Empresa eliminada exitosamente'
    };
  } catch (error) {
    console.error('Error deleting company:', error);
    return {
      ok: false,
      message: 'Error al eliminar la empresa'
    };
  }
};

// Establecer empresa como default
export const setDefaultCompany = async (id: string) => {
  try {
    // Desactivar default de todas las empresas
    await prisma.company.updateMany({
      data: { isDefault: false }
    });

    // Activar default en la empresa seleccionada
    const company = await prisma.company.update({
      where: { id },
      data: { isDefault: true }
    });

    revalidatePath('/admin/company');
    
    return {
      ok: true,
      company,
      message: 'Empresa establecida como predeterminada'
    };
  } catch (error) {
    console.error('Error setting default company:', error);
    return {
      ok: false,
      message: 'Error al establecer empresa predeterminada'
    };
  }
};

export const getCompanyNameLogo = async () => {
  noStore(); // ← Evita que se cachee esta función
  
  try {
    const company = await prisma.company.findFirst({
        where: { isDefault: true },
        select: {
          name: true,
          logo: true,
          phone: true
        }
      });

    if (!company) {
      return {
        ok: false,
        message: 'No se encontró la empresa predeterminada'
      };
    }

    return {
      ok: true,
      company
    };
  } catch (error) {
    console.error('Error getting company name and logo:', error);
    return {
      ok: false,
      message: 'Error al obtener el nombre y logo de la empresa'
    };
  }
};