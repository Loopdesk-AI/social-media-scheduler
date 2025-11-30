import { useState } from 'react';
import {
    User,
    Shield,
    Bell,
    Palette,
    Globe,
    Key,
    Sparkles,
    Download,
    Trash2,
    LogOut,
    Zap,
    TrendingUp,
    Clock,
    Target,
    CheckCircle2,
    Plus,
    AlertTriangle,
    RefreshCw,
    Settings,
    ExternalLink
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { platforms } from '../data/platforms';

// Helper to get brand color for platforms
const getPlatformColor = (id: string) => {
    const colors: Record<string, string> = {
        youtube: '#FF0000',
        instagram: '#E1306C',
        twitter: '#1DA1F2',
        linkedin: '#0A66C2',
        facebook: '#1877F2',
    };
    return colors[id] || '#666666';
};

type AccountViewProps = {
    initialSection?: 'social-connected' | 'social-add' | 'profile' | 'preferences' | 'security' | 'stats';
};

export function AccountView({ initialSection = 'social-connected' }: AccountViewProps) {
    const { user, logout, integrations, connectIntegration, disconnectIntegration, loading } = useApp();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState(initialSection);

    const socialIntegrations = integrations.filter(integration =>
        integration.providerIdentifier !== 'google-drive' &&
        integration.providerIdentifier !== 'dropbox'
    );

    const handleLogout = () => {
        logout();
        navigate('/login');
        toast.success('Logged out successfully');
    };

    const handleConnectPlatform = async (platformId: string) => {
        await connectIntegration(platformId);
    };

    const handleDisconnect = async (id: string) => {
        if (confirm('Are you sure you want to disconnect this account?')) {
            await disconnectIntegration(id);
        }
    };

    // Mock stats data
    const stats = {
        totalPosts: 1247,
        scheduledPosts: 89,
        publishedToday: 12,
        aiSuggestionsUsed: 342,
        accountsConnected: socialIntegrations.length,
        storageUsed: '2.4 GB',
        memberSince: new Date((user as any)?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };

    return (
        <div className="flex h-full overflow-hidden bg-white dark:bg-black">
            {/* Left Sidebar */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50 dark:bg-black/50">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="w-6 h-6 text-blue-600" />
                        Accounts
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Manage your social connections
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Social Connections Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                            Social Connections
                        </h3>
                        <div className="space-y-1">
                            <button
                                onClick={() => setActiveSection('social-connected')}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${activeSection === 'social-connected'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 size={18} />
                                    <span>Connected</span>
                                </div>
                                {socialIntegrations.length > 0 && (
                                    <span className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs py-0.5 px-2 rounded-full">
                                        {socialIntegrations.length}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setActiveSection('social-add')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${activeSection === 'social-add'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <Plus size={18} />
                                <span>Add New</span>
                            </button>
                        </div>
                    </div>

                    {/* Account Settings Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                            Account Settings
                        </h3>
                        <div className="space-y-1">
                            <button
                                onClick={() => setActiveSection('profile')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${activeSection === 'profile'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <User size={18} />
                                <span>Profile</span>
                            </button>
                            <button
                                onClick={() => setActiveSection('preferences')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${activeSection === 'preferences'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <Palette size={18} />
                                <span>Preferences</span>
                            </button>
                            <button
                                onClick={() => setActiveSection('security')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${activeSection === 'security'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <Shield size={18} />
                                <span>Security</span>
                            </button>
                            <button
                                onClick={() => setActiveSection('stats')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${activeSection === 'stats'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <TrendingUp size={18} />
                                <span>Statistics</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Security Tip */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
                            <AlertTriangle size={14} />
                            <span className="text-xs font-bold">Security Tip</span>
                        </div>
                        <p className="text-[11px] text-blue-600 dark:text-blue-300 leading-relaxed">
                            We use official APIs for all connections. Your credentials are never stored on our servers.
                        </p>
                    </div>
                    <div className="mt-4">
                        <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-black">
                <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {activeSection === 'social-connected' && 'Active Connections'}
                        {activeSection === 'social-add' && 'Available Platforms'}
                        {activeSection === 'profile' && 'Profile Settings'}
                        {activeSection === 'preferences' && 'App Preferences'}
                        {activeSection === 'security' && 'Security Settings'}
                        {activeSection === 'stats' && 'Account Statistics'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {activeSection === 'social-connected' && 'Manage and monitor your connected social profiles'}
                        {activeSection === 'social-add' && 'Select a platform to connect a new account'}
                        {activeSection === 'profile' && 'Update your personal information'}
                        {activeSection === 'preferences' && 'Customize your application experience'}
                        {activeSection === 'security' && 'Manage your password and account security'}
                        {activeSection === 'stats' && 'Overview of your account activity'}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {/* Social Connected View */}
                    {activeSection === 'social-connected' && (
                        <div className="space-y-4 max-w-3xl">
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                </div>
                            ) : socialIntegrations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                        <Plus size={24} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-gray-900 dark:text-white font-medium mb-2">No accounts connected</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mb-6">
                                        Connect your social media profiles to start scheduling and publishing content.
                                    </p>
                                    <button
                                        onClick={() => setActiveSection('social-add')}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Connect Account
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {socialIntegrations.map((integration) => (
                                        <div
                                            key={integration.id}
                                            className="group bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-blue-300 dark:hover:border-gray-700 transition-all duration-200 relative overflow-hidden shadow-sm"
                                        >
                                            {/* Status Indicator */}
                                            <div className={`absolute top-0 right-0 w-1.5 h-full ${integration.refreshNeeded ? 'bg-yellow-500' :
                                                integration.disabled ? 'bg-gray-600' : 'bg-green-500'
                                                }`} />

                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <img
                                                            src={integration.picture}
                                                            alt={integration.name}
                                                            className="w-14 h-14 rounded-xl object-cover border border-gray-200 dark:border-gray-800"
                                                        />
                                                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#111] p-0.5 rounded-full">
                                                            {integration.refreshNeeded ? (
                                                                <AlertTriangle size={14} className="text-yellow-500" />
                                                            ) : (
                                                                <CheckCircle2 size={14} className="text-green-500" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-gray-900 dark:text-white font-medium text-lg">{integration.name}</h4>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                            <span className="capitalize">{integration.providerIdentifier}</span>
                                                            {integration.profile?.username && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>@{integration.profile.username}</span>
                                                                </>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2 mt-2">
                                                            {integration.refreshNeeded && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-500/20">
                                                                    Reconnect Needed
                                                                </span>
                                                            )}
                                                            {integration.disabled && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                                                    Disabled
                                                                </span>
                                                            )}
                                                            {!integration.refreshNeeded && !integration.disabled && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-500 border border-green-200 dark:border-green-500/20">
                                                                    Active
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {integration.refreshNeeded && (
                                                        <button
                                                            onClick={() => handleConnectPlatform(integration.providerIdentifier)}
                                                            className="p-2 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 rounded-lg transition-colors"
                                                            title="Reconnect"
                                                        >
                                                            <RefreshCw size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                        title="Settings"
                                                    >
                                                        <Settings size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDisconnect(integration.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Disconnect"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Social Add View */}
                    {activeSection === 'social-add' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
                            {platforms.map(platform => (
                                <button
                                    key={platform.id}
                                    onClick={() => handleConnectPlatform(platform.id)}
                                    className="group flex items-center gap-4 p-5 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200 text-left"
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-200"
                                        style={{ backgroundColor: getPlatformColor(platform.id) }}
                                    >
                                        <span className="font-bold text-lg">{platform.name.charAt(0)}</span>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-gray-900 dark:text-white font-medium">{platform.name}</h4>
                                            <ExternalLink size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-600 dark:group-hover:text-gray-400">
                                            Connect your {platform.name} account
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Profile View */}
                    {activeSection === 'profile' && (
                        <div className="space-y-6 max-w-2xl">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-3xl font-bold text-blue-600 dark:text-blue-400">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h3>
                                    <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                                        <Sparkles size={12} />
                                        Pro Plan
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    defaultValue={user?.name || ''}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    defaultValue={user?.email || ''}
                                    disabled
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
                                <select className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white">
                                    <option>UTC+0 (London)</option>
                                    <option selected>UTC+5:30 (India)</option>
                                    <option>UTC-8 (Los Angeles)</option>
                                    <option>UTC-5 (New York)</option>
                                </select>
                            </div>
                            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/30">
                                Save Changes
                            </button>
                        </div>
                    )}

                    {/* Preferences View */}
                    {activeSection === 'preferences' && (
                        <div className="space-y-6 max-w-2xl">
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">Dark Mode</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Toggle app appearance</p>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className={`relative w-14 h-8 rounded-full transition-all ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                >
                                    <div
                                        className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">Notifications</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Get notified about scheduled posts</p>
                                    </div>
                                </div>
                                <button className="relative w-14 h-8 rounded-full bg-blue-600">
                                    <div className="absolute top-1 translate-x-7 w-6 h-6 rounded-full bg-white shadow-md transition-transform" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">Language</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred language</p>
                                    </div>
                                </div>
                                <select className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white">
                                    <option>English</option>
                                    <option>Spanish</option>
                                    <option>French</option>
                                    <option>German</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Security View */}
                    {activeSection === 'security' && (
                        <div className="space-y-6 max-w-2xl">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-3">
                                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Your account is secure</p>
                                    <p className="text-sm text-blue-700 dark:text-blue-400">Last sign-in: Today at 11:42 PM from India</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                                />
                            </div>

                            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/30">
                                Update Password
                            </button>

                            <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                                <button className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex items-center justify-center gap-2">
                                    <Trash2 size={18} />
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Stats View */}
                    {activeSection === 'stats' && (
                        <div className="space-y-6 max-w-3xl">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">Connected Accounts</p>
                                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-300">{stats.accountsConnected}</p>
                                </div>
                                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl border border-purple-200 dark:border-purple-800">
                                    <p className="text-sm text-purple-700 dark:text-purple-400 mb-2">Storage Used</p>
                                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-300">{stats.storageUsed}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap className="w-4 h-4 text-blue-600" />
                                        <span className="text-xs text-gray-500">Total Posts</span>
                                    </div>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalPosts}</p>
                                </div>
                                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-purple-600" />
                                        <span className="text-xs text-gray-500">Scheduled</span>
                                    </div>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.scheduledPosts}</p>
                                </div>
                                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="w-4 h-4 text-green-600" />
                                        <span className="text-xs text-gray-500">Published</span>
                                    </div>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.publishedToday}</p>
                                </div>
                                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-4 h-4 text-pink-600" />
                                        <span className="text-xs text-gray-500">AI Assists</span>
                                    </div>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.aiSuggestionsUsed}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                        <span className="font-medium text-gray-900 dark:text-white">Export Data</span>
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Download your data</span>
                                </button>
                                <button className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Key className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                        <span className="font-medium text-gray-900 dark:text-white">API Access</span>
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Manage API keys</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
