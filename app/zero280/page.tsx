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
    <div className="min-h-screen flex">
      <style jsx>{`
        @font-face {
          font-family: 'styreneB';
          src: url('/styrene-font-family-1755760563-0/StyreneB-Regular-Trial-BF63f6cbe9db1d5.otf') format('opentype');
          font-weight: 400;
          font-style: normal;
        }
        
        @font-face {
          font-family: 'styreneB';
          src: url('/styrene-font-family-1755760563-0/StyreneB-Bold-Trial-BF63f6cbe9f13bb.otf') format('opentype');
          font-weight: 700;
          font-style: normal;
        }
        
        .styrene-text {
          font-family: 'styreneB', system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
          font-weight: 400;
          font-size: 15px;
          line-height: 24px;
          letter-spacing: normal;
        }
        
        .styrene-heading {
          font-family: 'styreneB', system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
          font-weight: 700;
          font-size: 48px;
          line-height: 1.2;
          letter-spacing: normal;
        }
        
        .styrene-subheading {
          font-family: 'styreneB', system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
          font-weight: 400;
          font-size: 20px;
          line-height: 1.4;
          letter-spacing: normal;
        }
      `}</style>
      {/* Left Sidebar */}
      <div className="w-16 bg-[#fafafa] flex flex-col items-center py-6 space-y-8">
        {/* Document/File Icon */}
        <button className="w-6 h-6 flex items-center justify-center transition-colors group">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="sr-only">Documents</span>
        </button>

        {/* Plus/Add Icon - Orange Circle */}
        <button className="w-6 h-6 flex items-center justify-center transition-colors group">
          <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="sr-only">Create New</span>
        </button>

        {/* Chat/Conversation Icon */}
        <button className="w-6 h-6 flex items-center justify-center transition-colors group">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="sr-only">Chat</span>
        </button>

        {/* Stacked Documents Icon */}
        <button className="w-6 h-6 flex items-center justify-center transition-colors group">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" transform="translate(2,2)" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="sr-only">Stacked Documents</span>
        </button>

        {/* Geometric Shapes Grid Icon */}
        <button className="w-6 h-6 flex items-center justify-center transition-colors group">
          <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
            <div className="w-2 h-2 border border-gray-700 transform rotate-45"></div>
            <div className="w-2 h-2 border border-gray-700 transform rotate-45 scale-x-75 scale-y-150"></div>
            <div className="w-2 h-2 border border-gray-700 transform rotate-45 scale-x-75 scale-y-150"></div>
            <div className="w-2 h-2 border border-gray-700 rounded-full"></div>
          </div>
          <span className="sr-only">Geometric Shapes</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#fafafa]">
        {/* Top Section - AI Creation Interface */}
        <div className="flex flex-col items-center justify-center px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="styrene-heading text-gray-900 mb-4">
              The new way to build & sell online courses
            </h1>
            <p className="styrene-subheading text-gray-600">
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
                  className="w-full h-20 resize-none border-0 focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-400 text-base leading-relaxed styrene-text"
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
    </div>
  );
}
