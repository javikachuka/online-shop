"use client";

import { User } from "@/interfaces";

interface Props {
    users: User[];
}


export const UsersTable = ({users}: Props) => {
    return (
        <table className="min-w-full">
            <thead className="bg-gray-200 border-b">
                <tr>
                    <th
                        scope="col"
                        className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
                    >
                        Email
                    </th>
                    <th
                        scope="col"
                        className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
                    >
                        Nombre completo
                    </th>
                    <th
                        scope="col"
                        className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
                    >
                        Rol
                    </th>
                </tr>
            </thead>
            <tbody>
                {users?.length === 0 && (
                    <tr className="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100">
                        <td
                            colSpan={4}
                            className="px-6 py-4 text-sm font-medium text-gray-900 text-center"
                        >
                            No hay órdenes disponibles
                        </td>
                    </tr>
                )}
                {users?.map((user) => (
                    <tr
                        key={user.id}
                        className="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100"
                    >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.email}
                        </td>
                        <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                            {`${user.firstName} ${user.lastName}`}
                        </td>
                        <td className="flex items-center text-sm  text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                            {user.role}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
