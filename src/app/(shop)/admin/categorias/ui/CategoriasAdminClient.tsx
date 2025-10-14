"use client";
import { Modal } from '@/components/ui/modal/Modal';
import { CategoryForm } from './CategoryForm';
import { Pagination, Title } from '@/components';
import { useState } from 'react';

export function CategoriasAdminClient({ categories, totalPages }: { categories: any[]; totalPages: number }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editCategory, setEditCategory] = useState<any>(null);

    const openNewCategoryModal = () => {
        setEditCategory(null);
        setModalOpen(true);
    };
    const openEditCategoryModal = (categoria: any) => {
        setEditCategory(categoria);
        setModalOpen(true);
    };
    const closeModal = () => {
        setModalOpen(false);
        setEditCategory(null);
    };

    return (
        <>
            <Title title="Mantenimiento de Categorías" />
            <div className="flex justify-end mb-5">
                <button className="btn-primary" onClick={openNewCategoryModal}>
                    Nueva Categoría
                </button>
            </div>
            <div className="mb-10">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-200 border-b">
                            <tr>
                                <th className="text-sm font-medium text-gray-900 px-6 py-4 text-left">Nombre</th>
                                <th className="text-sm font-medium text-gray-900 px-6 py-4 text-left">Padre</th>
                                <th className="text-sm font-medium text-gray-900 px-6 py-4 text-left">Estado</th>
                                <th className="text-sm font-medium text-gray-900 px-6 py-4 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories?.length === 0 && (
                                <tr className="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100">
                                    <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900 text-center">
                                        No hay categorías disponibles
                                    </td>
                                </tr>
                            )}
                            {categories?.map((categoria) => {
                                // Construir la jerarquía de padres
                                let parentNames: string[] = [];
                                let currentParentId = categoria.parentId;
                                while (currentParentId) {
                                    const parent = categories.find(c => c.id === currentParentId);
                                    if (parent) {
                                        parentNames.unshift(parent.name);
                                        currentParentId = parent.parentId;
                                    } else {
                                        break;
                                    }
                                }
                                const fullPath = parentNames.length > 0 ? `${parentNames.join(' / ')} / ${categoria.name}` : categoria.name;
                                return (
                                    <tr key={categoria.id} className="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100">
                                        <td>
                                            <span className={categoria.parentId ? 'pl-4' : ''}>{fullPath}</span>
                                        </td>
                                        <td>
                                            {categoria.parentId ? parentNames.join(' / ') || 'Sin padre' : 'Raíz'}
                                        </td>
                                         <td>
                                            {categoria.isEnabled ? (
                                                <span className="text-green-600 font-semibold">Habilitada</span>
                                            ) : (
                                                <span className="text-red-600 font-semibold">Deshabilitada</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button className="text-blue-600 hover:underline mr-2" onClick={() => openEditCategoryModal(categoria)}>
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {totalPages && totalPages > 1 && (
                    <Pagination totalPages={totalPages}/>
                )}
            </div>
            {/* Modal para crear/editar categoría */}
            <Modal open={modalOpen} onClose={closeModal} title={editCategory ? 'Editar Categoría' : 'Nueva Categoría'}>
                <CategoryForm
                    category={editCategory}
                    categories={categories || []}
                    onClose={closeModal}
                />
            </Modal>
        </>
    );
}
