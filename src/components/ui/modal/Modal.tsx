import React from "react";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    width?: string;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, width }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div
                className={`bg-white rounded-lg shadow-lg p-6 relative w-full max-w-xl ${width || ''}`}
                role="dialog"
                aria-modal="true"
            >
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    onClick={onClose}
                    aria-label="Cerrar"
                >
                    ×
                </button>
                {title && <h2 className="text-lg font-bold mb-4">{title}</h2>}
                {children}
            </div>
        </div>
    );
};
