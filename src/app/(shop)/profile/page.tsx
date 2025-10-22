import { auth } from "@/auth.config";
import { Title } from "@/components";
import { redirect } from "next/navigation";

type ExtendedUser = {
    id: string;
    name: string;
    email: string;
    emailVerified?: boolean;
    role: string;
    image?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    createdAt?: string | Date;
};

export default async function ProfilePage() {
    const session = await auth() as { user: ExtendedUser } | null;

    if(!session?.user){
        // redirect('/auth/login?returnTo=/perfil')
        redirect('/')
    }

    return (
        <div className="flex justify-center items-center mb-72 px-4 sm:px-0">
            <div className="w-full max-w-2xl">
                <Title title="Mi Perfil" subtitle="Información de tu cuenta" />
                
                <div className="bg-white rounded-xl shadow-xl p-7 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Información personal */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                                Información Personal
                            </h3>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-600">Nombre</label>
                                <p className="text-gray-900 font-medium">
                                    {session.user.firstName} {session.user.lastName}
                                </p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-600">Email</label>
                                <p className="text-gray-900">{session.user.email}</p>
                            </div>
                            
                            {session.user.phone && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Teléfono</label>
                                    <p className="text-gray-900">{session.user.phone}</p>
                                </div>
                            )}
                        </div>

                        {/* Información de cuenta */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                                Información de Cuenta
                            </h3>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-600">Tipo de Usuario</label>
                                <p className="text-gray-900">
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                        session.user.role === 'admin' 
                                            ? 'bg-purple-100 text-purple-800' 
                                            : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {session.user.role === 'admin' ? 'Administrador' : 'Cliente'}
                                    </span>
                                </p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-600">Estado de Email</label>
                                <p className="text-gray-900">
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                        session.user.emailVerified 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {session.user.emailVerified ? 'Verificado' : 'Sin verificar'}
                                    </span>
                                </p>
                            </div>
                            
                            {session.user.createdAt && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Miembro desde</label>
                                    <p className="text-gray-900">
                                        {new Date(session.user.createdAt).toLocaleDateString('es-AR')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
