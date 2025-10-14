interface Props {
    status: string;
    Icon: React.ElementType;
    colorClass?: string;
}

export const OrderStatus = ({status, Icon, colorClass}: Props) => {
    return (
        <div
            className={`flex items-center rounded-lg py-2 px-3.5 font-bold text-white mb-5 ${colorClass ?? ''}`}
        >
            <Icon size={30} />
            <span className="mx-2">{status}</span>
        </div>
    );
};
