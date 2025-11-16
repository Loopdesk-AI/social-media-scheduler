import { useState } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import { PlatformCard } from './PlatformCard';
import { PlatformSelector } from './PlatformSelector';
import { platforms } from '../data/platforms';
import { useApp } from '../contexts/AppContext';

type SocialAccountsModalProps = {
  onClose: () => void;
};

export function SocialAccountsModal({
  onClose
}: SocialAccountsModalProps) {
  const { integrations, loading, connectIntegration, disconnectIntegration } = useApp();
  const [view, setView] = useState<'add' | 'connections'>('connections');

  const handleConnectPlatform = async (platformId: string) => {
    await connectIntegration(platformId);
  };

  const handleDisconnect = async (id: string) => {
    if (confirm('Are you sure you want to disconnect this account?')) {
      await disconnectIntegration(id);
    }
  };
  return <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f0f0f] w-full max-w-lg max-h-[90vh] rounded-xl shadow-2xl overflow-hidden border border-gray-800/50 flex flex-col">
        <div className="p-6 border-b border-gray-800/50">
          <div className="flex justify-between items-center">
            <h2 className="text-white text-xl font-semibold">
              {view === 'add' ? 'Add social accounts' : 'Social account connections'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800/50 rounded-md" aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {view === 'add' ? <div className="grid grid-cols-2 gap-3">
              {platforms.map(platform => <PlatformCard key={platform.id} platform={platform} onClick={() => handleConnectPlatform(platform.id)} />)}
            </div> : <div className="space-y-5">
              <PlatformSelector platforms={platforms} />
              <div className="min-h-72 border border-gray-800/70 rounded-lg bg-[#0a0a0a]">
                {loading ? (
                  <div className="flex items-center justify-center h-72">
                    <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                  </div>
                ) : integrations.length === 0 ? (
                  <div className="flex items-center justify-center h-72">
                    <div className="text-center px-6">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/30 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <line x1="19" x2="19" y1="8" y2="14" />
                          <line x1="22" x2="16" y1="11" y2="11" />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm">
                        No accounts connected yet
                      </p>
                      <p className="text-gray-600 text-xs mt-1">
                        Add your first social account to get started
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {integrations.map((integration) => (
                      <div
                        key={integration.id}
                        className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-gray-800/50 hover:border-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={integration.picture}
                            alt={integration.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <div className="text-white font-medium">{integration.name}</div>
                            <div className="text-gray-400 text-sm capitalize">
                              {integration.providerIdentifier}
                              {integration.profile?.username && ` • @${integration.profile.username}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {integration.refreshNeeded && (
                            <span className="text-yellow-500 text-xs px-2 py-1 bg-yellow-500/10 rounded">
                              Reconnect needed
                            </span>
                          )}
                          {integration.disabled && (
                            <span className="text-gray-500 text-xs px-2 py-1 bg-gray-500/10 rounded">
                              Disabled
                            </span>
                          )}
                          <button
                            onClick={() => handleDisconnect(integration.id)}
                            className="text-gray-400 hover:text-red-400 transition-colors p-2 hover:bg-gray-800/50 rounded"
                            title="Disconnect"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-1">
                <button className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black font-medium px-5 py-2.5 rounded-lg transition-colors" onClick={() => setView('add')}>
                  <Plus size={18} />
                  Add account
                </button>
              </div>
            </div>}
        </div>
      </div>
    </div>;
}