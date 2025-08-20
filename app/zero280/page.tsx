'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ArtifactsGrid } from '@/components/artifacts/artifacts-grid';

export default function Zero280Page() {
  const [input, setInput] = useState('i want to teach people how to...');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);

    try {
      // Create the conversation first
      const response = await fetch('/api/zero280', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
          userId: undefined, // You can add user authentication later
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Redirect to the build page with the conversation ID
        if (data.conversationId) {
          router.push(`/zero280/build?conversationId=${data.conversationId}`);
        } else {
          // Fallback to message-based redirect if no conversation ID
          router.push(`/zero280/build?message=${encodeURIComponent(input.trim())}`);
        }
      } else {
        // Fallback to message-based redirect on error
        router.push(`/zero280/build?message=${encodeURIComponent(input.trim())}`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Fallback to message-based redirect on error
      router.push(`/zero280/build?message=${encodeURIComponent(input.trim())}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-orange-100">
      {/* Top Section - AI Creation Interface */}
      <div className="flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: '"styreneB", "styreneB Fallback", system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
            The new way to build & sell online courses
          </h1>
          <p className="text-xl text-gray-600" style={{ fontFamily: '"styreneB", "styreneB Fallback", system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
            help people learn new skills with ai
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-16">
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="i want to teach people how to..."
                className="w-full h-32 resize-none border-0 focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-400 text-lg leading-relaxed"
                style={{ fontFamily: '"styreneB", "styreneB Fallback", system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
              />
              
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center text-white transition-colors"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Bottom Section - My Workspace */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <ArtifactsGrid />
        </div>
      </div>
    </div>
  );
}
