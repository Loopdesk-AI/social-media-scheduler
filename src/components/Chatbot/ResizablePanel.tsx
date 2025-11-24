import { useState, useEffect, useRef, ReactNode } from 'react';

interface ResizablePanelProps {
    children: ReactNode;
    isOpen: boolean;
    onClose: () => void;
    minWidth?: number;
    maxWidth?: number;
    defaultWidth?: number;
}

export function ResizablePanel({
    children,
    isOpen,
    onClose,
    minWidth = 320,
    maxWidth = 800,
    defaultWidth = 400
}: ResizablePanelProps) {
    const [width, setWidth] = useState(defaultWidth);
    const [isResizing, setIsResizing] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Load saved width from localStorage
    useEffect(() => {
        const savedWidth = localStorage.getItem('chat_panel_width');
        if (savedWidth) {
            const parsedWidth = parseInt(savedWidth, 10);
            if (parsedWidth >= minWidth && parsedWidth <= maxWidth) {
                setWidth(parsedWidth);
            }
        }
    }, [minWidth, maxWidth]);

    // Save width to localStorage
    useEffect(() => {
        localStorage.setItem('chat_panel_width', width.toString());
    }, [width]);

    // Handle mouse move during resize
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            const newWidth = window.innerWidth - e.clientX;
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, minWidth, maxWidth]);

    const handleResizeStart = () => {
        setIsResizing(true);
    };

    return (
        <>
            {/* Overlay when resizing */}
            {isResizing && (
                <div className="fixed inset-0 z-40" style={{ cursor: 'ew-resize' }} />
            )}

            {/* Panel */}
            <div
                ref={panelRef}
                className={`fixed right-0 top-0 h-full bg-white dark:bg-black border-l border-gray-200 dark:border-gray-800 shadow-2xl flex transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                style={{
                    width: `${width}px`,
                    transition: isResizing ? 'none' : 'transform 300ms ease-in-out'
                }}
            >
                {/* Resize Handle */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 transition-colors group"
                    onMouseDown={handleResizeStart}
                >
                    <div className="absolute left-0 top-0 bottom-0 w-4 -translate-x-1.5" />
                    {/* Visual indicator on hover */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gray-300 dark:bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col ml-1">
                    {children}
                </div>
            </div>
        </>
    );
}
