'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ArtifactsGrid } from '@/components/artifacts/artifacts-grid';

export default function Zero280Page() {
  const [input, setInput] = useState('i want to create a beautiful landing page');
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
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Build something{' '}
            <span className="inline-flex items-center">
              Love
              <svg className="w-8 h-8 mx-2" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="url(#heartGradient)"
                />
                <defs>
                  <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff6b6b" />
                    <stop offset="50%" stopColor="#feca57" />
                    <stop offset="100%" stopColor="#ff9ff3" />
                  </linearGradient>
                </defs>
              </svg>
              able
            </span>
          </h1>
          <p className="text-xl text-gray-600">
            Create apps and websites by chatting with AI
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-16">
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <button
                  type="button"
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                >
                  <span className="text-lg font-semibold">+</span>
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center space-x-2 text-sm text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Public</span>
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full bg-green-100 hover:bg-green-200 flex items-center space-x-2 text-sm text-green-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Supabase</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="i want to create a beautiful landing page"
                className="w-full h-32 resize-none border-0 focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-400 text-lg leading-relaxed"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
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
