import { Plus, Search, MessageSquare, Trash2, Edit2, MoreVertical } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Conversation {
    id: string;
    title: string;
    platform?: string;
    updatedAt: string;
    messageCount: number;
}

interface ChatSidebarProps {
    onSelectConversation: (id: string) => void;
    onNewChat: () => void;
    currentConversationId?: string;
}

export function ChatSidebar({ onSelectConversation, onNewChat, currentConversationId }: ChatSidebarProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const response = await fetch('http://localhost:3001/api/chat/conversations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setConversations(data);
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteConversation = async (id: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://localhost:3001/api/chat/conversations/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setConversations(prev => prev.filter(c => c.id !== id));
                toast.success('Conversation deleted');
                if (currentConversationId === id) {
                    onNewChat();
                }
            }
        } catch (error) {
            toast.error('Failed to delete conversation');
        }
    };

    const renameConversation = async (id: string, newTitle: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://localhost:3001/api/chat/conversations/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: newTitle })
            });

            if (response.ok) {
                setConversations(prev => prev.map(c =>
                    c.id === id ? { ...c, title: newTitle } : c
                ));
                toast.success('Conversation renamed');
                setEditingId(null);
            }
        } catch (error) {
            toast.error('Failed to rename conversation');
        }
    };

    const filteredConversations = conversations.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupByDate = (convos: Conversation[]) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const groups: { [key: string]: Conversation[] } = {
            'Today': [],
            'Yesterday': [],
            'Last 7 Days': [],
            'Older': []
        };

        convos.forEach(c => {
            const date = new Date(c.updatedAt);
            if (date >= today) {
                groups['Today'].push(c);
            } else if (date >= yesterday) {
                groups['Yesterday'].push(c);
            } else if (date >= lastWeek) {
                groups['Last 7 Days'].push(c);
            } else {
                groups['Older'].push(c);
            }
        });

        return groups;
    };

    const groupedConversations = groupByDate(filteredConversations);

    const [showSettings, setShowSettings] = useState(false);
    const [apiKey, setApiKey] = useState('');

    const saveApiKey = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://localhost:3001/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ geminiApiKey: apiKey })
            });

            if (response.ok) {
                toast.success('API Key saved successfully');
                setShowSettings(false);
            } else {
                toast.error('Failed to save API Key');
            }
        } catch (error) {
            toast.error('Error saving API Key');
        }
    };

    return (
        <div className="w-64 h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex gap-2">
                <button
                    onClick={onNewChat}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    <span className="font-medium">New Chat</span>
                </button>
                <button
                    onClick={() => setShowSettings(true)}
                    className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Settings"
                >
                    <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
                </button>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Gemini API Key
                                </label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your Gemini API Key"
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 transition-colors"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Your key is stored securely in the database.
                                </p>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveApiKey}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="p-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto px-2">
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
                    </div>
                ) : (
                    Object.entries(groupedConversations).map(([group, convos]) => (
                        convos.length > 0 && (
                            <div key={group} className="mb-4">
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {group}
                                </div>
                                {convos.map(convo => (
                                    <div
                                        key={convo.id}
                                        className={`group relative px-3 py-2.5 rounded-lg mb-1 cursor-pointer transition-colors ${currentConversationId === convo.id
                                            ? 'bg-blue-100 dark:bg-blue-900/30'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                        onClick={() => onSelectConversation(convo.id)}
                                    >
                                        {editingId === convo.id ? (
                                            <input
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                onBlur={() => renameConversation(convo.id, editTitle)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        renameConversation(convo.id, editTitle);
                                                    } else if (e.key === 'Escape') {
                                                        setEditingId(null);
                                                    }
                                                }}
                                                className="w-full px-2 py-1 bg-white dark:bg-gray-700 border border-blue-500 rounded text-sm outline-none"
                                                autoFocus
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <>
                                                <div className="flex items-start gap-2">
                                                    <MessageSquare size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                            {convo.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {convo.messageCount} messages
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingId(convo.id);
                                                            setEditTitle(convo.title);
                                                        }}
                                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                                    >
                                                        <Edit2 size={12} className="text-gray-600 dark:text-gray-400" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm('Delete this conversation?')) {
                                                                deleteConversation(convo.id);
                                                            }
                                                        }}
                                                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                                    >
                                                        <Trash2 size={12} className="text-red-600 dark:text-red-400" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    ))
                )}
            </div>
        </div>
    );
}
