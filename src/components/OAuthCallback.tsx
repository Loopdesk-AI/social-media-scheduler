import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { toast } from 'sonner';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleCallback = async () => {
      const integration = searchParams.get('integration');
      const error = searchParams.get('error');
      const provider = window.location.pathname.split('/')[3]; // /integrations/social/:provider

      // Check if backend already processed the callback (redirected with integration=success)
      if (integration === 'success') {
        setStatus('success');
        toast.success('Account connected successfully!');
        setTimeout(() => navigate('/'), 1500);
        return;
      }

      // Check if there was an error
      if (error) {
        setStatus('error');
        toast.error(decodeURIComponent(error));
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      // Legacy flow: frontend calls backend callback (not used anymore)
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code || !state || !provider) {
        setStatus('error');
        toast.error('Invalid OAuth callback');
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      try {
        await api.handleOAuthCallback(provider, code, state);
        setStatus('success');
        toast.success('Account connected successfully!');
        setTimeout(() => navigate('/'), 1500);
      } catch (error) {
        console.error('OAuth callback failed:', error);
        setStatus('error');
        toast.error('Failed to connect account');
        setTimeout(() => navigate('/'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Connecting your account...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-white text-lg">Account connected!</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-white text-lg">Connection failed</p>
          </>
        )}
      </div>
    </div>
  );
}
