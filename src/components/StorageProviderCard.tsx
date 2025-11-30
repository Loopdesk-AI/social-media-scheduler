import { HardDrive, FolderOpen, X } from 'lucide-react';

interface StorageProvider {
  identifier: string;
  name: string;
  icon: string;
}

interface StorageIntegration {
  id: string;
  providerIdentifier: string;
  name: string;
  email?: string;
  picture?: string;
  quota?: {
    used: number;
    total: number;
    usedFormatted: string;
    totalFormatted: string;
    percentUsed: number;
  };
  refreshNeeded?: boolean;
}

interface StorageProviderCardProps {
  provider: StorageProvider;
  integration?: StorageIntegration;
  onConnect: () => void;
  onDisconnect: () => void;
  onBrowse: () => void;
}

export function StorageProviderCard({
  provider,
  integration,
  onConnect,
  onDisconnect,
  onBrowse
}: StorageProviderCardProps) {
  const isConnected = !!integration;

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-600/20 flex items-center justify-center">
            <HardDrive size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{provider.name}</h3>
            {isConnected && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{integration.email}</p>
            )}
          </div>
        </div>

        {isConnected && (
          <button
            onClick={onDisconnect}
            className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Disconnect"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isConnected && integration.quota && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Storage</span>
            <span className="text-gray-900 dark:text-gray-300">
              {integration.quota.usedFormatted} of {integration.quota.totalFormatted}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
              style={{ width: `${integration.quota.percentUsed}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {!isConnected ? (
          <button
            onClick={onConnect}
            className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
          >
            Connect
          </button>
        ) : (
          <>
            {integration.refreshNeeded ? (
              <button
                onClick={onConnect}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
              >
                Reconnect
              </button>
            ) : (
              <button
                onClick={onBrowse}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <FolderOpen size={16} />
                Browse
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}