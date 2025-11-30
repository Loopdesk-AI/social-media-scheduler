
import { useState, useEffect } from 'react';
import { api, StorageFile } from '@/lib/api';
import { Folder, File, Image, Video, ChevronRight, ArrowLeft, Loader2, AlertCircle, Eye, X, Music } from 'lucide-react';
import { toast } from 'sonner';

interface StorageFileBrowserProps {
    integrationId: string;
    onFileSelect: (file: StorageFile) => void;
    filterTypes?: string[]; // e.g., ['image', 'video']
}

export function StorageFileBrowser({ integrationId, onFileSelect, filterTypes }: StorageFileBrowserProps) {
    const [files, setFiles] = useState<StorageFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([{ id: 'root', name: 'Root' }]);

    // Preview State
    const [previewFile, setPreviewFile] = useState<StorageFile | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    const fetchFiles = async (folderId?: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.listStorageFiles(integrationId, folderId === 'root' ? undefined : folderId);
            setFiles(response.files);
        } catch (err) {
            console.error('Error fetching files:', err);
            setError('Failed to load files');
            toast.error('Failed to load files');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles(currentFolderId);
    }, [integrationId, currentFolderId]);

    const handleFolderClick = (folder: StorageFile) => {
        setCurrentFolderId(folder.id);
        setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
    };

    const handleBreadcrumbClick = (index: number) => {
        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newBreadcrumbs);
        const folderId = newBreadcrumbs[newBreadcrumbs.length - 1].id;
        setCurrentFolderId(folderId === 'root' ? undefined : folderId);
    };

    const handleBackClick = () => {
        if (breadcrumbs.length > 1) {
            handleBreadcrumbClick(breadcrumbs.length - 2);
        }
    };

    const isSelectable = (file: StorageFile) => {
        if (!filterTypes || filterTypes.length === 0) return true;

        // Check MIME type
        if (filterTypes.some(type => file.mimeType.includes(type))) return true;

        // Fallback: Check file extension for common media types
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension) return false;

        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
        const videoExtensions = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv'];
        const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a'];

        if (filterTypes.includes('image') && imageExtensions.includes(extension)) return true;
        if (filterTypes.includes('video') && videoExtensions.includes(extension)) return true;
        if (filterTypes.includes('audio') && audioExtensions.includes(extension)) return true;
        // If we want to support audio preview even if not selectable for post (assuming post only takes video/image)
        // But for now, let's stick to what's requested.

        return false;
    };

    const getFileIcon = (file: StorageFile) => {
        if (file.isFolder) return <Folder className="w-10 h-10 text-blue-500" />;
        if (file.mimeType.startsWith('image/')) return <Image className="w-10 h-10 text-purple-500" />;
        if (file.mimeType.startsWith('video/')) return <Video className="w-10 h-10 text-red-500" />;
        if (file.mimeType.startsWith('audio/')) return <Music className="w-10 h-10 text-green-500" />;
        return <File className="w-10 h-10 text-gray-400" />;
    };

    const handlePreview = async (e: React.MouseEvent, file: StorageFile) => {
        e.stopPropagation(); // Prevent selection
        setPreviewFile(file);
        setLoadingPreview(true);
        setPreviewUrl(null);

        try {
            const response = await api.getStorageDownloadUrl(integrationId, file.id);
            setPreviewUrl(response.url);
        } catch (error) {
            console.error('Failed to get preview URL:', error);
            toast.error('Failed to load preview');
            setPreviewFile(null);
        } finally {
            setLoadingPreview(false);
        }
    };

    const closePreview = () => {
        setPreviewFile(null);
        setPreviewUrl(null);
    };

    return (
        <div className="flex flex-col h-full relative">
            {/* Header / Breadcrumbs */}
            <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <button
                    onClick={handleBackClick}
                    disabled={breadcrumbs.length <= 1}
                    className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                <div className="flex items-center overflow-x-auto scrollbar-hide">
                    {breadcrumbs.map((crumb, index) => (
                        <div key={crumb.id} className="flex items-center whitespace-nowrap">
                            {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />}
                            <button
                                onClick={() => handleBreadcrumbClick(index)}
                                className={`text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${index === breadcrumbs.length - 1
                                    ? 'text-gray-900 dark:text-white font-semibold'
                                    : 'text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                {crumb.name}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <p>Loading files...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 text-red-500">
                        <AlertCircle className="w-8 h-8 mb-2" />
                        <p>{error}</p>
                        <button
                            onClick={() => fetchFiles(currentFolderId)}
                            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                ) : files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                        <Folder className="w-12 h-12 mb-2 opacity-20" />
                        <p>This folder is empty</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {files.map((file) => {
                            const selectable = !file.isFolder && isSelectable(file);
                            const isMedia = !file.isFolder && (
                                file.mimeType.startsWith('image/') ||
                                file.mimeType.startsWith('video/') ||
                                file.mimeType.startsWith('audio/') ||
                                // Check extensions for generic mime types
                                ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'mp3', 'wav'].some(ext => file.name.toLowerCase().endsWith('.' + ext))
                            );

                            return (
                                <div
                                    key={file.id}
                                    onClick={() => {
                                        if (file.isFolder) {
                                            handleFolderClick(file);
                                        } else if (selectable) {
                                            onFileSelect(file);
                                        }
                                    }}
                                    className={`
                    group relative flex flex-col items-center p-4 rounded-xl border transition-all duration-200
                    ${file.isFolder
                                            ? 'cursor-pointer border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                            : selectable
                                                ? 'cursor-pointer border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 hover:shadow-md'
                                                : 'opacity-50 cursor-not-allowed border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50'
                                        }
                  `}
                                >
                                    <div className="mb-3 relative">
                                        {file.thumbnailUrl ? (
                                            <img
                                                src={file.thumbnailUrl}
                                                alt={file.name}
                                                className="w-20 h-20 object-cover rounded-lg shadow-sm"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                }}
                                            />
                                        ) : null}
                                        <div className={`${file.thumbnailUrl ? 'hidden' : ''} flex items-center justify-center w-20 h-20`}>
                                            {getFileIcon(file)}
                                        </div>
                                    </div>

                                    <div className="w-full text-center">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate w-full mb-1" title={file.name}>
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {file.isFolder ? 'Folder' : file.sizeFormatted}
                                        </p>
                                    </div>

                                    {/* Hover overlay for selectable files */}
                                    {!file.isFolder && (
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 rounded-xl transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            {isMedia && (
                                                <button
                                                    onClick={(e) => handlePreview(e, file)}
                                                    className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:scale-110 transition-transform text-blue-600 dark:text-blue-400"
                                                    title="Preview"
                                                >
                                                    <Eye size={20} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {previewFile && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-full flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate pr-4">
                                {previewFile.name}
                            </h3>
                            <button
                                onClick={closePreview}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 p-6 flex items-center justify-center bg-gray-50 dark:bg-black/50 min-h-[300px] overflow-hidden">
                            {loadingPreview ? (
                                <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                    <p>Loading preview...</p>
                                </div>
                            ) : previewUrl ? (
                                <>
                                    {(previewFile.mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => previewFile.name.toLowerCase().endsWith('.' + ext))) && (
                                        <img
                                            src={previewUrl}
                                            alt={previewFile.name}
                                            className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md"
                                        />
                                    )}
                                    {(previewFile.mimeType.startsWith('video/') || ['mp4', 'mov', 'webm'].some(ext => previewFile.name.toLowerCase().endsWith('.' + ext))) && (
                                        <video
                                            src={previewUrl}
                                            controls
                                            autoPlay
                                            className="max-w-full max-h-[60vh] rounded-lg shadow-md"
                                        />
                                    )}
                                    {(previewFile.mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg'].some(ext => previewFile.name.toLowerCase().endsWith('.' + ext))) && (
                                        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col items-center">
                                            <Music className="w-16 h-16 text-blue-500 mb-4" />
                                            <audio src={previewUrl} controls className="w-full" />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-red-500 flex flex-col items-center">
                                    <AlertCircle className="w-8 h-8 mb-2" />
                                    <p>Preview unavailable</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
