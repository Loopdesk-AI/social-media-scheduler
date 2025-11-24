import { X, Send, Sparkles, Bot, User, Copy, Check, RotateCcw, Download, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'sonner';
import { ResizablePanel } from './ResizablePanel';
import { ChatSidebar } from './ChatSidebar';
import { platformTemplates, getTemplateByCommand } from './PlatformTemplates';
import remarkGfm from 'remark-gfm';

interface ChatInterfaceProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export function ChatInterface({ isOpen, onClose }: ChatInterfaceProps) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [showEmptyBubble, setShowEmptyBubble] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false); // Default to closed
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [showCommandMenu, setShowCommandMenu] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, showEmptyBubble]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                e.preventDefault();
                handleNewChat();
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
                e.preventDefault();
                setShowSidebar(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Detect slash commands
    useEffect(() => {
        if (input.startsWith('/')) {
            setShowCommandMenu(true);
        } else {
            setShowCommandMenu(false);
        }
    }, [input]);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success('Copied to clipboard');
    };

    const exportConversation = () => {
        const text = messages.map(m => `${m.role.toUpperCase()}:\n${m.content}\n\n`).join('');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation-${Date.now()}.txt`;
        a.click();
        toast.success('Conversation exported');
    };

    const handleNewChat = () => {
        setMessages([]);
        setCurrentConversationId(null);
        setSelectedPlatform(null);
        inputRef.current?.focus();
    };

    const handleSelectConversation = async (id: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://localhost:3001/api/chat/conversations/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentConversationId(id);
                setMessages(data.messages.map((m: any) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content
                })));
                setSelectedPlatform(data.platform);
            }
        } catch (error) {
            toast.error('Failed to load conversation');
        }
    };

    const handleCommandSelect = (command: string) => {
        const template = getTemplateByCommand(command);
        if (template) {
            setSelectedPlatform(template.id);
            setInput('');
            setShowCommandMenu(false);
            inputRef.current?.focus();
            toast.success(`${template.name} mode activated`);
        }
    };

    const regenerateMessage = async (messageIndex: number) => {
        const messagesToResend = messages.slice(0, messageIndex);
        const lastUserMessage = messagesToResend[messagesToResend.length - 1];

        if (lastUserMessage && lastUserMessage.role === 'user') {
            setMessages(messagesToResend);
            await sendMessage(lastUserMessage.content, messagesToResend.slice(0, -1));
        }
    };

    const sendMessage = async (userMessage: string, previousMessages: Message[] = messages) => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            toast.error('Please log in to send messages');
            return;
        }

        console.log('[CHAT] Sending message with conversationId:', currentConversationId);

        // Apply platform template if selected
        let finalMessage = userMessage;
        if (selectedPlatform) {
            const template = platformTemplates.find(t => t.id === selectedPlatform);
            if (template && template.prompt) {
                finalMessage = template.prompt + userMessage;
            }
        }

        const userMsg: Message = {
            id: Math.random().toString(36).substring(7),
            role: 'user',
            content: finalMessage
        };
        setMessages(prev => [...prev, userMsg]);

        setShowEmptyBubble(true);
        setIsStreaming(true);

        const assistantMsg: Message = {
            id: Math.random().toString(36).substring(7),
            role: 'assistant',
            content: ''
        };

        try {
            const response = await fetch('http://localhost:3001/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    conversationId: currentConversationId,
                    messages: [...previousMessages, userMsg].map(m => ({
                        role: m.role,
                        parts: [{ type: 'text', text: m.content }]
                    }))
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            // Update conversation ID if this was a new chat
            const newConversationId = response.headers.get('X-Conversation-Id');
            console.log('[CHAT] Received conversationId from server:', newConversationId);
            console.log('[CHAT] Current conversationId state:', currentConversationId);
            if (newConversationId && newConversationId !== currentConversationId) {
                console.log('[CHAT] Updating conversationId to:', newConversationId);
                setCurrentConversationId(newConversationId);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (reader) {
                let firstChunk = true;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);

                    if (firstChunk) {
                        setShowEmptyBubble(false);
                        assistantMsg.content = chunk;
                        setMessages(prev => [...prev, assistantMsg]);
                        firstChunk = false;
                    } else {
                        setMessages(prev => {
                            const newMessages = [...prev];
                            const lastMsg = newMessages[newMessages.length - 1];
                            if (lastMsg.role === 'assistant') {
                                lastMsg.content += chunk;
                            }
                            return newMessages;
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            toast.error('Failed to send message. Check your API Key.');
            setShowEmptyBubble(false);
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setIsStreaming(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isStreaming) {
            sendMessage(input.trim());
            setInput('');
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
        if (e.key === 'Backspace' && input === '' && selectedPlatform) {
            setSelectedPlatform(null);
        }
    };



    const characterCount = input.length;
    const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
    const filteredCommands = platformTemplates.filter(t =>
        t.command.toLowerCase().includes(input.toLowerCase())
    );

    return (
        <ResizablePanel isOpen={isOpen} onClose={onClose} defaultWidth={450} minWidth={380} maxWidth={900}>
            <div className="flex h-full">
                {/* Sidebar */}
                {showSidebar && (
                    <ChatSidebar
                        onSelectConversation={handleSelectConversation}
                        onNewChat={handleNewChat}
                        currentConversationId={currentConversationId || undefined}
                    />
                )}

                {/* Main Chat */}
                <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-md flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowSidebar(!showSidebar)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                title={showSidebar ? 'Hide history' : 'Show history'}
                            >
                                {showSidebar ? (
                                    <PanelLeftClose size={18} className="text-gray-600 dark:text-gray-400" />
                                ) : (
                                    <PanelLeft size={18} className="text-gray-600 dark:text-gray-400" />
                                )}
                            </button>
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${selectedPlatform ? platformTemplates.find(t => t.id === selectedPlatform)?.color : 'from-blue-500 to-purple-600'} flex items-center justify-center shadow-lg`}>
                                {selectedPlatform ? (
                                    (() => {
                                        const Icon = platformTemplates.find(t => t.id === selectedPlatform)?.icon;
                                        return Icon ? <Icon className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />;
                                    })()
                                ) : (
                                    <Sparkles className="w-5 h-5 text-white" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                                    {selectedPlatform ? platformTemplates.find(t => t.id === selectedPlatform)?.name : 'Super Intelligence'}
                                </h3>
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                    {selectedPlatform ? 'Optimized for platform' : 'Powered by Gemini 2.5 Flash'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {messages.length > 0 && (
                                <button
                                    onClick={exportConversation}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    title="Export conversation"
                                >
                                    <Download size={18} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>



                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50 dark:bg-gray-900/20">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <Bot size={48} className="text-gray-400 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
                                    How can I help you create today?
                                </p>
                                <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">
                                    Type / to see platform templates
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded">⌘K</kbd>
                                        <span>Focus input</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded">⌘N</kbd>
                                        <span>New chat</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded">⌘B</kbd>
                                        <span>Toggle sidebar</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded">/</kbd>
                                        <span>Commands</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {messages.map((m, index) => (
                            <div
                                key={m.id}
                                className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} `}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${m.role === 'user'
                                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                        : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md'
                                        } `}
                                >
                                    {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                </div>

                                <div
                                    className={`group relative max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${m.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none'
                                        } `}
                                >
                                    <div className="prose dark:prose-invert prose-sm max-w-none prose-headings:font-bold prose-p:leading-relaxed prose-li:my-1">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                code({ node, inline, className, children, ...props }: any) {
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    return !inline && match ? (
                                                        <div className="relative my-4">
                                                            <SyntaxHighlighter
                                                                style={oneDark}
                                                                language={match[1]}
                                                                PreTag="div"
                                                                customStyle={{
                                                                    borderRadius: '0.5rem',
                                                                    padding: '1rem',
                                                                    fontSize: '0.875rem'
                                                                }}
                                                                {...props}
                                                            >
                                                                {String(children).replace(/\n$/, '')}
                                                            </SyntaxHighlighter>
                                                            <button
                                                                onClick={() => copyToClipboard(String(children), `code-${m.id}`)}
                                                                className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs flex items-center gap-1"
                                                            >
                                                                {copiedId === `code-${m.id}` ? <Check size={12} /> : <Copy size={12} />}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <code className={`${className} px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm`} {...props}>
                                                            {children}
                                                        </code>
                                                    );
                                                },
                                                p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                                ul: ({ children }) => <ul className="my-3 space-y-1">{children}</ul>,
                                                ol: ({ children }) => <ol className="my-3 space-y-1">{children}</ol>,
                                                li: ({ children }) => <li className="ml-4">{children}</li>,
                                                strong: ({ children }) => <strong className="font-bold text-gray-900 dark:text-white">{children}</strong>,
                                                h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>,
                                                h2: ({ children }) => <h2 className="text-xl font-bold mt-3 mb-2">{children}</h2>,
                                                h3: ({ children }) => <h3 className="text-lg font-bold mt-2 mb-1">{children}</h3>,
                                            }}
                                        >
                                            {m.content}
                                        </ReactMarkdown>
                                    </div>

                                    {m.role === 'assistant' && m.content && (
                                        <div className="absolute -bottom-8 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => copyToClipboard(m.content, m.id)}
                                                className="p-1.5 text-gray-400 hover:text-blue-500 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                                                title="Copy"
                                            >
                                                {copiedId === m.id ? <Check size={14} /> : <Copy size={14} />}
                                            </button>
                                            <button
                                                onClick={() => regenerateMessage(index)}
                                                className="p-1.5 text-gray-400 hover:text-blue-500 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                                                title="Regenerate"
                                            >
                                                <RotateCcw size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {showEmptyBubble && (
                            <div className="flex gap-3 animate-fade-in">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                                    <Bot size={14} className="text-white" />
                                </div>
                                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white dark:bg-black border-t border-gray-100 dark:border-gray-800 shrink-0">
                        {/* Command Menu */}
                        {showCommandMenu && filteredCommands.length > 0 && (
                            <div className="mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                                {filteredCommands.map(template => {
                                    const Icon = template.icon;
                                    return (
                                        <button
                                            key={template.id}
                                            onClick={() => handleCommandSelect(template.command)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                                        >
                                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                                                <Icon size={16} className="text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900 dark:text-white">{template.name}</div>
                                                <div className="text-xs text-gray-500">{template.command}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-gray-100 dark:bg-gray-900 border border-transparent focus-within:bg-white dark:focus-within:bg-black focus-within:border-blue-500 rounded-xl transition-all shadow-inner p-2">
                            {selectedPlatform && (
                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gradient-to-br ${platformTemplates.find(t => t.id === selectedPlatform)?.color} text-white text-xs font-medium shrink-0 mb-1`}>
                                    {(() => {
                                        const Icon = platformTemplates.find(t => t.id === selectedPlatform)?.icon;
                                        return Icon ? <Icon size={12} /> : null;
                                    })()}
                                    {platformTemplates.find(t => t.id === selectedPlatform)?.name}
                                    <button type="button" onClick={() => setSelectedPlatform(null)} className="hover:bg-white/20 rounded-full p-0.5 ml-1">
                                        <X size={10} />
                                    </button>
                                </div>
                            )}
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleInputKeyDown}
                                placeholder={selectedPlatform ? "Type your prompt..." : "Type / for commands or ask anything..."}
                                className="w-full bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500 resize-none py-2 max-h-[120px] min-h-[24px]"
                                disabled={isStreaming}
                                rows={1}
                                style={{ minHeight: '24px', maxHeight: '120px' }}
                            />
                            <button
                                type="submit"
                                disabled={isStreaming || !input.trim()}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-md shadow-blue-600/20 shrink-0"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                        {input && (
                            <div className="flex justify-between mt-2 text-xs text-gray-500">
                                <span>{characterCount} characters • {wordCount} words</span>
                                <span className="text-gray-400">Shift+Enter for new line</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ResizablePanel>
    );
}
