import { useState, useEffect } from 'react';
import { StorageFileBrowser } from './StorageFileBrowser';
import { storageProviders, StorageProvider } from '@/data/storageProviders';
import { useApp } from '@/contexts/AppContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { HardDrive, Plus, AlertCircle, Cloud, Trash2, RefreshCw } from 'lucide-react';

export function ContentLibraryView() {
  const { storageIntegrations, refreshStorageIntegrations } = useApp();
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);

  // Select the first integration by default if available and none selected
  useEffect(() => {
    if (storageIntegrations.length > 0 && !selectedIntegration) {
      setSelectedIntegration(storageIntegrations[0]);
    }
  }, [storageIntegrations, selectedIntegration]);

  const connectedIntegrations = storageIntegrations.filter((integration: any) =>
    storageProviders.some((provider: StorageProvider) => provider.identifier === integration.providerIdentifier)
  );

  const availableProviders = storageProviders.filter((provider: StorageProvider) =>
    !storageIntegrations.some((integration: any) => integration.providerIdentifier === provider.identifier)
  );

  const handleConnect = async (providerIdentifier: string) => {
    try {
      const response = await api.getStorageAuthUrl(providerIdentifier);
      window.location.href = response.url;
    } catch (error) {
      console.error('Failed to connect storage provider:', error);
      toast.error('Failed to connect storage provider');
    }
  };

  const handleDisconnect = async (integrationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to disconnect this provider?')) return;

    try {
      await api.deleteStorageIntegration(integrationId);
      await refreshStorageIntegrations();
      if (selectedIntegration?.id === integrationId) {
        setSelectedIntegration(null);
      }
      toast.success('Storage provider disconnected');
    } catch (error) {
      console.error('Failed to disconnect storage provider:', error);
      toast.error('Failed to disconnect storage provider');
    }
  };

  const handleReconnect = async (providerIdentifier: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await api.getStorageAuthUrl(providerIdentifier);
      window.location.href = response.url;
    } catch (error) {
      console.error('Failed to reconnect storage provider:', error);
      toast.error('Failed to reconnect storage provider');
    }
  };

  const handleFileSelect = (file: any) => {
    console.log(`✅ File selected:`, file);
    toast.success(`Selected file: ${file.name}`);
    // In a real app, this might open a details panel or trigger an action
  };

  return (
    <div className="flex h-full overflow-hidden bg-white dark:bg-black">
      {/* Left Sidebar - Storage Providers */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50 dark:bg-black/50">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Cloud className="w-6 h-6 text-blue-600" />
            Storage
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your cloud files
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Connected Providers */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
              Connected
            </h3>
            <div className="space-y-2">
              {connectedIntegrations.map((integration: any) => {
                const isSelected = selectedIntegration?.id === integration.id;
                const provider = storageProviders.find(p => p.identifier === integration.providerIdentifier);

                return (
                  <div
                    key={integration.id}
                    onClick={() => setSelectedIntegration(integration)}
                    className={`
                      group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200
                      ${isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'}
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center
                        ${isSelected ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}
                      `}>
                        <HardDrive size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>
                          {provider?.name || integration.providerIdentifier}
                        </p>
                        <p className={`text-xs truncate ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500'}`}>
                          {integration.accountEmail || 'Connected'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {integration.refreshNeeded && (
                        <button
                          onClick={(e) => handleReconnect(integration.providerIdentifier, e)}
                          className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"
                          title="Reconnect required"
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDisconnect(integration.id, e)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Disconnect"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {connectedIntegrations.length === 0 && (
                <div className="text-sm text-gray-500 px-2 italic">
                  No providers connected
                </div>
              )}
            </div>
          </div>

          {/* Available Providers */}
          {availableProviders.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                Add Account
              </h3>
              <div className="space-y-2">
                {availableProviders.map((provider: StorageProvider) => (
                  <button
                    key={provider.identifier}
                    onClick={() => handleConnect(provider.identifier)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 group-hover:text-blue-500 transition-colors">
                      <Plus size={16} />
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      Connect {provider.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-black">
        {selectedIntegration ? (
          <div className="flex-1 flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-black">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {storageProviders.find(p => p.identifier === selectedIntegration.providerIdentifier)?.name || 'Storage'}
                </h1>
                {selectedIntegration.refreshNeeded && (
                  <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-full flex items-center gap-1">
                    <AlertCircle size={12} />
                    Reconnect Required
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {selectedIntegration.accountEmail}
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {selectedIntegration.refreshNeeded ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                    <RefreshCw className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Connection Expired</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                    Your connection to {selectedIntegration.providerName} has expired. Please reconnect to continue accessing your files.
                  </p>
                  <button
                    onClick={(e) => handleReconnect(selectedIntegration.providerIdentifier, e)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Reconnect Account
                  </button>
                </div>
              ) : (
                <StorageFileBrowser
                  integrationId={selectedIntegration.id}
                  onFileSelect={handleFileSelect}
                  filterTypes={['image', 'video', 'audio']}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <Cloud className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Select a Storage Provider
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
              Choose a connected storage provider from the sidebar to browse and manage your media files.
            </p>
            {connectedIntegrations.length === 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl max-w-md">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Get started by connecting your Google Drive or Dropbox account using the sidebar.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}