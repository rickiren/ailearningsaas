'use client';

import { DrillPreview as DrillPreviewType } from '@/types/artifacts';
import { Play, Clock, Target, ChevronRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface DrillPreviewProps {
  data: DrillPreviewType;
  isStreaming?: boolean;
}

const DRILL_TYPE_CONFIG = {
  flashcards: {
    icon: Target,
    title: 'Flashcard Drill',
    description: 'Quick recall practice with cards',
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  'practice-problems': {
    icon: Target,
    title: 'Practice Problems',
    description: 'Hands-on problem solving',
    color: 'bg-green-50 text-green-700 border-green-200'
  },
  'interactive-demo': {
    icon: Play,
    title: 'Interactive Demo',
    description: 'Step-by-step walkthrough',
    color: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  simulation: {
    icon: RotateCcw,
    title: 'Simulation',
    description: 'Real-world scenario practice',
    color: 'bg-orange-50 text-orange-700 border-orange-200'
  }
};

export function DrillPreview({ data, isStreaming }: DrillPreviewProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isStarted, setIsStarted] = useState(false);

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/10">
        <div className="text-center">
          <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Practice Drill Yet</h3>
          <p className="text-muted-foreground">
            Request a specific drill to practice your skills
          </p>
        </div>
      </div>
    );
  }

  const config = DRILL_TYPE_CONFIG[data.type];
  const Icon = config.icon;

  const renderFlashcards = () => {
    const cards = data.content?.cards || [];
    const currentCard = cards[currentStep] || {};

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border-2 border-dashed border-primary/30 rounded-xl p-8 text-center min-h-[300px] flex flex-col justify-center relative">
          {cards.length > 0 ? (
            <>
              <div className="text-sm text-muted-foreground mb-4">
                Card {currentStep + 1} of {cards.length}
              </div>
              <div className="text-xl font-medium mb-6">
                {currentCard.question || 'Question will appear here'}
              </div>
              {isStarted && (
                <div className="text-base text-muted-foreground animate-in fade-in duration-500">
                  {currentCard.answer || 'Answer will be revealed'}
                </div>
              )}
              <div className="mt-6 flex gap-2 justify-center">
                <Button 
                  onClick={() => setIsStarted(!isStarted)}
                  variant={isStarted ? "outline" : "default"}
                >
                  {isStarted ? 'Hide Answer' : 'Reveal Answer'}
                </Button>
                {currentStep < cards.length - 1 && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCurrentStep(currentStep + 1);
                      setIsStarted(false);
                    }}
                  >
                    Next Card <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mx-auto mb-4" />
              <div className="h-8 bg-muted rounded w-2/3 mx-auto mb-6" />
              <div className="h-10 bg-muted rounded w-32 mx-auto" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPracticeProblems = () => {
    const problems = data.content?.problems || [];
    const currentProblem = problems[currentStep] || {};

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-background border rounded-lg p-6">
          {problems.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  Problem {currentStep + 1} of {problems.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Difficulty: {currentProblem.difficulty || 'Medium'}
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-4">{currentProblem.title}</h3>
              <p className="mb-6 leading-relaxed">{currentProblem.description}</p>
              
              {currentProblem.code && (
                <div className="bg-muted/50 rounded-lg p-4 mb-4 font-mono text-sm">
                  <pre>{currentProblem.code}</pre>
                </div>
              )}

              <div className="flex gap-2">
                <Button>Start Solving</Button>
                <Button variant="outline">Show Hint</Button>
                <Button variant="outline">View Solution</Button>
              </div>
            </>
          ) : (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-6 bg-muted rounded w-1/2" />
              <div className="h-20 bg-muted rounded" />
              <div className="h-10 bg-muted rounded w-32" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderInteractiveDemo = () => {
    const steps = data.content?.steps || [];
    
    return (
      <div className="max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Steps List */}
          <div className="bg-background border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Demo Steps</h3>
            <div className="space-y-2">
              {steps.length > 0 ? steps.map((step: any, index: number) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                    index === currentStep ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50',
                    isStreaming && index === steps.length - 1 && 'animate-in slide-in-from-left duration-500'
                  )}
                  onClick={() => setCurrentStep(index)}
                >
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium',
                    index === currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{step.description}</div>
                  </div>
                </div>
              )) : (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse flex items-center gap-3 p-3">
                    <div className="w-6 h-6 bg-muted rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Demo Content */}
          <div className="bg-muted/20 border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Interactive Demo Area</h3>
              <p className="text-muted-foreground text-sm">
                Demo content will be displayed here
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (data.type) {
      case 'flashcards':
        return renderFlashcards();
      case 'practice-problems':
        return renderPracticeProblems();
      case 'interactive-demo':
        return renderInteractiveDemo();
      default:
        return renderFlashcards();
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">{data.title}</h1>
                <p className="text-muted-foreground">{data.description}</p>
              </div>
            </div>
            
            <div className={cn(
              'px-3 py-1 rounded-full text-sm font-medium border',
              config.color
            )}>
              {config.title}
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{data.estimatedTime} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>Practice Drill</span>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Progress</span>
              <span>0%</span>
            </div>
            <Progress value={0} className="h-2" />
          </div>
        </div>

        {/* Content */}
        {renderContent()}

        {/* Streaming Indicator */}
        {isStreaming && (
          <div className="fixed bottom-6 right-6 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
              <span className="text-sm font-medium">Creating drill...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}