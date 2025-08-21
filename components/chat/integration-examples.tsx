'use client';

import { useState } from 'react';
import { Send, Plus, Sparkles, FileText, Map, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import your new components
import { 
  InstantTypingIndicator,
  InstantAcknowledgment,
  ProgressHints,
  MessageBubbleAppearing,
  InputLoadingState,
  useProgressSimulation
} from './instant-loading-states';
import {
  MessageSkeleton,
  MindmapSkeleton,
  CourseModuleSkeleton,
  DrillPreviewSkeleton,
  ProgressiveContentSkeleton
} from './skeleton-loading';
import {
  FadeIn,
  SlideInFromBottom,
  SmoothHeight,
  HoverCard,
  TypingEffect,
  SmoothProgressBar
} from './smooth-animations';

// INTEGRATION EXAMPLE 1: Enhanced Message Flow
export function ExampleMessageFlow() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAck, setShowAck] = useState(false);
  const [userMessage, setUserMessage] = useState('');

  const { stage, progress } = useProgressSimulation(isLoading);

  const handleSendMessage = async (message: string) => {
    // 1. Show instant acknowledgment
    setShowAck(true);
    setUserMessage(message);
    
    // 2. Add user message with animation
    setMessages(prev => [...prev, { 
      id: Date.now(), 
      content: message, 
      role: 'user',
      timestamp: new Date()
    }]);

    // 3. Start loading with progress hints
    setIsLoading(true);
    
    // 4. Hide acknowledgment after 2s
    setTimeout(() => setShowAck(false), 2000);

    // 5. Simulate API call
    try {
      // Your existing chat API call here
      await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate delay
      
      // 6. Add AI response with animation
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: "Here's your comprehensive learning path!",
        role: 'assistant',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Show instant acknowledgment */}
      <SmoothHeight>
        {showAck && <InstantAcknowledgment userMessage={userMessage} />}
      </SmoothHeight>

      {/* Show progress hints */}
      <SmoothHeight>
        {isLoading && <ProgressHints stage={stage} progress={progress} />}
      </SmoothHeight>

      {/* Messages */}
      <div className="space-y-4">
        {messages.map((message) => (
          <MessageBubbleAppearing key={message.id}>
            <div className={`p-4 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-500 text-white ml-auto max-w-xs' 
                : 'bg-gray-100 text-gray-800 mr-auto max-w-md'
            }`}>
              {message.content}
            </div>
          </MessageBubbleAppearing>
        ))}
      </div>

      {/* Show typing indicator while loading */}
      {isLoading && <InstantTypingIndicator isVisible={true} />}

      <Button onClick={() => handleSendMessage("Create a JavaScript learning path")}>
        Try Example
      </Button>
    </div>
  );
}

// INTEGRATION EXAMPLE 2: Skeleton Loading States
export function ExampleSkeletonStates() {
  const [contentType, setContentType] = useState<'message' | 'mindmap' | 'course' | 'drill'>('message');
  const [isLoading, setIsLoading] = useState(false);

  const showSkeleton = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000); // Hide after 3 seconds
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button 
          onClick={() => setContentType('message')}
          variant={contentType === 'message' ? 'default' : 'outline'}
        >
          Message
        </Button>
        <Button 
          onClick={() => setContentType('mindmap')}
          variant={contentType === 'mindmap' ? 'default' : 'outline'}
        >
          Mindmap
        </Button>
        <Button 
          onClick={() => setContentType('course')}
          variant={contentType === 'course' ? 'default' : 'outline'}
        >
          Course
        </Button>
        <Button 
          onClick={() => setContentType('drill')}
          variant={contentType === 'drill' ? 'default' : 'outline'}
        >
          Drill
        </Button>
      </div>

      <Button onClick={showSkeleton}>Show Skeleton Loading</Button>

      <SmoothHeight>
        {isLoading && (
          <ProgressiveContentSkeleton 
            type={contentType}
            showProgress={true}
          />
        )}
      </SmoothHeight>
    </div>
  );
}

// INTEGRATION EXAMPLE 3: Smooth Animations
export function ExampleSmoothAnimations() {
  const [showElements, setShowElements] = useState(false);
  const [progress, setProgress] = useState(0);

  const triggerAnimations = () => {
    setShowElements(true);
    // Simulate progress
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
      }
    }, 200);
  };

  return (
    <div className="space-y-4">
      <Button onClick={triggerAnimations}>
        Trigger Animations
      </Button>

      <Button onClick={() => {
        setShowElements(false);
        setProgress(0);
      }}>
        Reset
      </Button>

      <SmoothHeight>
        {showElements && (
          <div className="space-y-4">
            <FadeIn delay={100}>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold">Fade In Animation</h3>
                <p>This element fades in smoothly with a delay</p>
              </div>
            </FadeIn>

            <SlideInFromBottom delay={300}>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold">Slide In Animation</h3>
                <p>This element slides in from the bottom</p>
              </div>
            </SlideInFromBottom>

            <HoverCard>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg cursor-pointer">
                <h3 className="font-semibold">Hover Card</h3>
                <p>Hover over this card to see smooth scaling</p>
              </div>
            </HoverCard>

            <div className="space-y-2">
              <h3 className="font-semibold">Smooth Progress Bar</h3>
              <SmoothProgressBar progress={progress} color="blue" />
              <p className="text-sm text-gray-600">{progress}% complete</p>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold mb-2">Typing Effect</h3>
              <TypingEffect 
                text="This text appears with a realistic typing effect..."
                speed={50}
              />
            </div>
          </div>
        )}
      </SmoothHeight>
    </div>
  );
}

// INTEGRATION GUIDE COMPONENT
export function IntegrationGuide() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Responsive Chat Integration Guide
        </h1>
        <p className="text-lg text-gray-600">
          Examples of how to integrate the new loading states and animations
        </p>
      </div>

      {/* Example 1 */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
          1. Enhanced Message Flow
        </h2>
        <p className="text-gray-600">
          Shows instant acknowledgment, progress hints, and smooth message animations
        </p>
        <div className="border border-gray-200 rounded-lg p-4">
          <ExampleMessageFlow />
        </div>
      </div>

      {/* Example 2 */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
          2. Skeleton Loading States
        </h2>
        <p className="text-gray-600">
          Different skeleton loading patterns for various content types
        </p>
        <div className="border border-gray-200 rounded-lg p-4">
          <ExampleSkeletonStates />
        </div>
      </div>

      {/* Example 3 */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
          3. Smooth Animations
        </h2>
        <p className="text-gray-600">
          Various animation components for smooth transitions
        </p>
        <div className="border border-gray-200 rounded-lg p-4">
          <ExampleSmoothAnimations />
        </div>
      </div>

      {/* Integration Steps */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
          Quick Integration Steps
        </h2>
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-800">1. Replace ChatInput</h3>
            <code className="block bg-gray-100 p-2 rounded text-sm">
              {`import { EnhancedChatInput } from './enhanced-chat-input';`}
            </code>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-800">2. Replace ChatMessage</h3>
            <code className="block bg-gray-100 p-2 rounded text-sm">
              {`import { EnhancedChatMessage } from './enhanced-chat-message';`}
            </code>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-800">3. Add Animations</h3>
            <code className="block bg-gray-100 p-2 rounded text-sm">
              {`import { FadeIn, SmoothHeight } from './smooth-animations';`}
            </code>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-800">4. Add Loading States</h3>
            <code className="block bg-gray-100 p-2 rounded text-sm">
              {`import { ProgressHints, MessageSkeleton } from './instant-loading-states';`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}