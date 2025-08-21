'use client';

import { cn } from '@/lib/utils';
import { Bot, FileText, Map, Sparkles, Brain } from 'lucide-react';

// Base skeleton animation class
const skeletonBase = "animate-pulse bg-gradient-to-r from-slate-200 via-slate-50 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]";

// Shimmer animation keyframes (you'll need to add this to your CSS)
export const shimmerKeyframes = `
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;

// Generic Skeleton Block
export function SkeletonBlock({ 
  width = "100%", 
  height = "1rem", 
  className,
  rounded = "rounded"
}: { 
  width?: string, 
  height?: string, 
  className?: string,
  rounded?: string 
}) {
  return (
    <div 
      className={cn(skeletonBase, rounded, className)}
      style={{ width, height }}
    />
  );
}

// Message Skeleton
export function MessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={cn(
      "animate-in slide-in-from-bottom-3 fade-in duration-300 ease-out",
      "flex gap-4 px-4 py-3"
    )}>
      {/* Avatar */}
      <div className={cn(
        "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm",
        isUser 
          ? "bg-white border-slate-200 text-slate-700" 
          : "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-200"
      )}>
        {isUser ? (
          <SkeletonBlock width="16px" height="16px" rounded="rounded-full" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>
      
      <div className="flex-1 min-w-0 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <SkeletonBlock width="120px" height="14px" />
          <SkeletonBlock width="60px" height="12px" />
        </div>
        
        {/* Content */}
        <div className={cn(
          isUser 
            ? "rounded-2xl px-4 py-3 bg-blue-500" 
            : ""
        )}>
          <div className="space-y-2">
            <SkeletonBlock height="16px" />
            <SkeletonBlock width="85%" height="16px" />
            <SkeletonBlock width="70%" height="16px" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Mindmap Skeleton
export function MindmapSkeleton() {
  return (
    <div className="animate-in slide-in-from-bottom-3 fade-in duration-300 ease-out">
      <div className="flex gap-4 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-200 shadow-sm">
          <Bot className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-3">
            <SkeletonBlock width="140px" height="14px" />
            <div className="flex items-center gap-1.5">
              <Map className="h-3 w-3 text-blue-500" />
              <SkeletonBlock width="60px" height="12px" />
            </div>
          </div>
          
          {/* Mindmap Preview */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <SkeletonBlock width="150px" height="16px" />
              <SkeletonBlock width="60px" height="20px" rounded="rounded-full" />
            </div>
            
            {/* Mindmap Structure */}
            <div className="space-y-3">
              {/* Main topic */}
              <div className="flex items-center justify-center">
                <SkeletonBlock width="200px" height="32px" rounded="rounded-lg" />
              </div>
              
              {/* Sub topics - arranged like a mindmap */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <SkeletonBlock width="120px" height="24px" rounded="rounded-lg" />
                  <div className="ml-4 space-y-1">
                    <SkeletonBlock width="100px" height="16px" rounded="rounded" />
                    <SkeletonBlock width="90px" height="16px" rounded="rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <SkeletonBlock width="130px" height="24px" rounded="rounded-lg" />
                  <div className="ml-4 space-y-1">
                    <SkeletonBlock width="110px" height="16px" rounded="rounded" />
                    <SkeletonBlock width="85px" height="16px" rounded="rounded" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-blue-200">
              <SkeletonBlock width="180px" height="16px" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Course Module Skeleton
export function CourseModuleSkeleton() {
  return (
    <div className="animate-in slide-in-from-bottom-3 fade-in duration-300 ease-out">
      <div className="flex gap-4 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-200 shadow-sm">
          <Bot className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-3">
            <SkeletonBlock width="140px" height="14px" />
            <div className="flex items-center gap-1.5">
              <FileText className="h-3 w-3 text-blue-500" />
              <SkeletonBlock width="80px" height="12px" />
            </div>
          </div>
          
          {/* Module Content */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-xl p-4">
            {/* Module Title */}
            <div className="flex items-center justify-between mb-4">
              <SkeletonBlock width="200px" height="20px" />
              <SkeletonBlock width="80px" height="24px" rounded="rounded-full" />
            </div>
            
            {/* Module Sections */}
            <div className="space-y-4">
              {[1, 2, 3].map((index) => (
                <div key={index} className="border-l-4 border-blue-200 pl-4">
                  <SkeletonBlock width="160px" height="16px" className="mb-2" />
                  <div className="space-y-1">
                    <SkeletonBlock width="100%" height="14px" />
                    <SkeletonBlock width="85%" height="14px" />
                  </div>
                  
                  {/* Lesson items */}
                  <div className="mt-3 ml-4 space-y-2">
                    {[1, 2].map((lessonIndex) => (
                      <div key={lessonIndex} className="flex items-center gap-2">
                        <SkeletonBlock width="8px" height="8px" rounded="rounded-full" />
                        <SkeletonBlock width="120px" height="12px" />
                        <SkeletonBlock width="40px" height="12px" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Drill Preview Skeleton
export function DrillPreviewSkeleton() {
  return (
    <div className="animate-in slide-in-from-bottom-3 fade-in duration-300 ease-out">
      <div className="flex gap-4 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border bg-gradient-to-br from-purple-500 to-purple-600 text-white border-purple-200 shadow-sm">
          <Brain className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-3">
            <SkeletonBlock width="140px" height="14px" />
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-purple-500" />
              <SkeletonBlock width="100px" height="12px" />
            </div>
          </div>
          
          {/* Drill Content */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
            {/* Question */}
            <div className="mb-4">
              <SkeletonBlock width="60px" height="16px" className="mb-2" />
              <SkeletonBlock width="100%" height="18px" />
              <SkeletonBlock width="80%" height="18px" />
            </div>
            
            {/* Answer Options */}
            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((option) => (
                <div key={option} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-100">
                  <div className="w-6 h-6 border-2 border-purple-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-purple-600">{option}</span>
                  </div>
                  <SkeletonBlock width="200px" height="14px" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Progressive Content Skeleton
export function ProgressiveContentSkeleton({ 
  type = 'message',
  showProgress = true 
}: { 
  type?: 'message' | 'mindmap' | 'course' | 'drill',
  showProgress?: boolean 
}) {
  const renderSkeleton = () => {
    switch (type) {
      case 'mindmap':
        return <MindmapSkeleton />;
      case 'course':
        return <CourseModuleSkeleton />;
      case 'drill':
        return <DrillPreviewSkeleton />;
      default:
        return <MessageSkeleton />;
    }
  };

  return (
    <div className="space-y-4">
      {showProgress && (
        <div className="px-4">
          <div className="flex items-center gap-3 mb-2">
            <SkeletonBlock width="120px" height="14px" />
            <SkeletonBlock width="60px" height="20px" rounded="rounded-full" />
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}
      
      {renderSkeleton()}
    </div>
  );
}