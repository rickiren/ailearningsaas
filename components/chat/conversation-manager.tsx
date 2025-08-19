'use client';

import { MessageSquare } from 'lucide-react';

interface ConversationManagerProps {
  currentConversationId?: string;
  userId?: string;
}

export function ConversationManager({ 
  currentConversationId, 
  userId
}: ConversationManagerProps) {



  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-900">Conversations</h3>
      </div>

      {/* Current Conversation Info */}
      {currentConversationId && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Current Build Session</span>
          </div>
          <div className="text-xs text-blue-700 mt-1">
            ID: {currentConversationId.substring(0, 8)}...
          </div>
        </div>
      )}


    </div>
  );
}
