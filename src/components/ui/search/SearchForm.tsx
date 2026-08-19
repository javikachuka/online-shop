import { IoSearchOutline } from "react-icons/io5";

interface Props {
    action: string;
    defaultValue?: string;
    label?: string;
    parameterName?: string;
    placeholder?: string;
}

export const SearchForm = ({
    action,
    defaultValue = "",
    label = "Buscar",
    parameterName = "q",
    placeholder = "Buscar..."
}: Props) => {
    return (
        <form action={action} className="w-full sm:w-80">
            <label htmlFor={`${parameterName}-search`} className="sr-only">
                {label}
            </label>
            <div className="relative">
                <input
                    id={`${parameterName}-search`}
                    name={parameterName}
                    type="search"
                    defaultValue={defaultValue}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-4 pr-11 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    aria-label={label}
                    title={label}
                    className="absolute inset-y-0 right-1 flex w-8 items-center justify-center text-gray-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <IoSearchOutline aria-hidden="true" className="h-5 w-5" />
                </button>
            </div>
        </form>
    );
};