import { useState, useEffect } from 'react';
import { X, Clock, Check, ChevronUp, ChevronDown } from 'lucide-react';

interface TimePickerModalProps {
    initialDate: Date;
    onClose: () => void;
    onConfirm: (date: Date) => void;
}

export function TimePickerModal({ initialDate, onClose, onConfirm }: TimePickerModalProps) {
    const [hours, setHours] = useState(initialDate.getHours() % 12 || 12);
    const [minutes, setMinutes] = useState(initialDate.getMinutes());
    const [period, setPeriod] = useState<'AM' | 'PM'>(initialDate.getHours() >= 12 ? 'PM' : 'AM');

    // Ensure minutes are 0 or 30 for cleaner initial UX, or keep exact if needed
    useEffect(() => {
        // Optional: Round to nearest 5 or 15 minutes if desired
    }, []);

    const handleConfirm = () => {
        const newDate = new Date(initialDate);
        let newHours = hours;

        if (period === 'PM' && hours !== 12) newHours += 12;
        if (period === 'AM' && hours === 12) newHours = 0;

        newDate.setHours(newHours);
        newDate.setMinutes(minutes);
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);

        onConfirm(newDate);
    };

    const incrementHours = () => setHours(h => h === 12 ? 1 : h + 1);
    const decrementHours = () => setHours(h => h === 1 ? 12 : h - 1);

    const incrementMinutes = () => setMinutes(m => (m + 5) % 60);
    const decrementMinutes = () => setMinutes(m => (m - 5 + 60) % 60);

    const togglePeriod = () => setPeriod(p => p === 'AM' ? 'PM' : 'AM');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-[#0a0a0a] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#111]">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Clock size={20} className="text-blue-500" />
                        Set Time
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 flex flex-col items-center">
                    <div className="flex items-center gap-4 mb-8">
                        {/* Hours */}
                        <div className="flex flex-col items-center gap-2">
                            <button onClick={incrementHours} className="p-1 text-gray-500 hover:text-blue-500 transition-colors">
                                <ChevronUp size={24} />
                            </button>
                            <div className="w-20 h-20 bg-[#111] rounded-2xl border border-gray-800 flex items-center justify-center text-4xl font-bold text-white shadow-inner">
                                {hours.toString().padStart(2, '0')}
                            </div>
                            <button onClick={decrementHours} className="p-1 text-gray-500 hover:text-blue-500 transition-colors">
                                <ChevronDown size={24} />
                            </button>
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Hour</span>
                        </div>

                        <div className="text-4xl font-bold text-gray-600 pb-6">:</div>

                        {/* Minutes */}
                        <div className="flex flex-col items-center gap-2">
                            <button onClick={incrementMinutes} className="p-1 text-gray-500 hover:text-blue-500 transition-colors">
                                <ChevronUp size={24} />
                            </button>
                            <div className="w-20 h-20 bg-[#111] rounded-2xl border border-gray-800 flex items-center justify-center text-4xl font-bold text-white shadow-inner">
                                {minutes.toString().padStart(2, '0')}
                            </div>
                            <button onClick={decrementMinutes} className="p-1 text-gray-500 hover:text-blue-500 transition-colors">
                                <ChevronDown size={24} />
                            </button>
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Minute</span>
                        </div>

                        {/* Period */}
                        <div className="flex flex-col items-center gap-2 ml-2">
                            <div
                                onClick={togglePeriod}
                                className="h-20 flex flex-col bg-[#111] rounded-2xl border border-gray-800 overflow-hidden cursor-pointer"
                            >
                                <div className={`flex-1 px-4 flex items-center justify-center font-bold transition-colors ${period === 'AM' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-800'}`}>
                                    AM
                                </div>
                                <div className={`flex-1 px-4 flex items-center justify-center font-bold transition-colors ${period === 'PM' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-800'}`}>
                                    PM
                                </div>
                            </div>
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Period</span>
                        </div>
                    </div>

                    <div className="w-full grid grid-cols-3 gap-2 mb-2">
                        <button
                            onClick={() => { setHours(9); setMinutes(0); setPeriod('AM'); }}
                            className="py-2 px-3 rounded-lg bg-gray-900 border border-gray-800 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                        >
                            Morning
                        </button>
                        <button
                            onClick={() => { setHours(1); setMinutes(0); setPeriod('PM'); }}
                            className="py-2 px-3 rounded-lg bg-gray-900 border border-gray-800 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                        >
                            Afternoon
                        </button>
                        <button
                            onClick={() => { setHours(6); setMinutes(0); setPeriod('PM'); }}
                            className="py-2 px-3 rounded-lg bg-gray-900 border border-gray-800 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                        >
                            Evening
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 bg-[#111] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-900/20 flex items-center gap-2"
                    >
                        <Check size={18} />
                        Confirm Time
                    </button>
                </div>
            </div>
        </div>
    );
}
