import { Pencil } from 'lucide-react';

interface ChatTriggerProps {
    onClick: () => void;
    isOpen: boolean;
}

export function ChatTrigger({ onClick, isOpen }: ChatTriggerProps) {
    return (
        <button
            onClick={onClick}
            className={`fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-40 ${isOpen ? 'rotate-45 opacity-0 pointer-events-none' : 'rotate-0 opacity-100'
                }`}
            title="Open Super Intelligence"
        >
            <Pencil size={24} />
        </button>
    );
}
