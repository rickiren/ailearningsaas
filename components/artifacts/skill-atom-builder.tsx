'use client';

import { SkillAtom } from '@/types/artifacts';
import { Clock, Target, BookOpen, CheckCircle, Link, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface SkillAtomBuilderProps {
  data: SkillAtom;
  isStreaming?: boolean;
}

const DIFFICULTY_COLORS = {
  beginner: 'text-green-600 bg-green-50 border-green-200',
  intermediate: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  advanced: 'text-red-600 bg-red-50 border-red-200',
};

const RESOURCE_ICONS = {
  article: BookOpen,
  video: Play,
  book: BookOpen,
  course: Target,
  documentation: BookOpen,
  tool: Link,
};

export function SkillAtomBuilder({ data, isStreaming }: SkillAtomBuilderProps) {
  if (!data) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/10">
        <div className="text-center">
          <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Skill Details Yet</h3>
          <p className="text-muted-foreground">
            Ask AI to break down a specific skill for detailed learning materials
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{data.title}</h1>
              <p className="text-muted-foreground text-lg">{data.description}</p>
            </div>
            <div className={cn(
              'px-3 py-1 rounded-full border text-sm font-medium',
              DIFFICULTY_COLORS[data.level]
            )}>
              {data.level}
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{data.estimatedHours} hours</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>{data.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{data.resources?.length || 0} resources</span>
            </div>
          </div>
        </div>

        {/* Prerequisites */}
        {data.prerequisites && data.prerequisites.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Prerequisites</h2>
            <div className="grid gap-2">
              {data.prerequisites.map((prereq, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-3 p-3 bg-muted/50 rounded-lg',
                    isStreaming && index === data.prerequisites.length - 1 && 'animate-in slide-in-from-left duration-500'
                  )}
                >
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{prereq}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Learning Objectives */}
        {data.objectives && data.objectives.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Learning Objectives</h2>
            <div className="grid gap-3">
              {data.objectives.map((objective, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg',
                    isStreaming && index === data.objectives.length - 1 && 'animate-in slide-in-from-left duration-500'
                  )}
                >
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                    {index + 1}
                  </div>
                  <span className="leading-relaxed">{objective}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Resources */}
        {data.resources && data.resources.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Learning Resources</h2>
            <div className="grid gap-4">
              {data.resources.map((resource, index) => {
                const Icon = RESOURCE_ICONS[resource.type] || BookOpen;
                
                return (
                  <div
                    key={resource.id}
                    className={cn(
                      'border rounded-lg p-4 hover:shadow-md transition-shadow',
                      isStreaming && index === data.resources.length - 1 && 'animate-in slide-in-from-left duration-500'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-medium">{resource.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'px-2 py-1 text-xs rounded-full border',
                          DIFFICULTY_COLORS[resource.difficulty]
                        )}>
                          {resource.difficulty}
                        </span>
                        {resource.estimatedTime && (
                          <span className="text-xs text-muted-foreground">
                            {resource.estimatedTime}min
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {resource.url && (
                      <div className="mt-3">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Link className="h-3 w-3" />
                          Open Resource
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Exercises */}
        {data.exercises && data.exercises.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Practice Exercises</h2>
            <div className="grid gap-4">
              {data.exercises.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className={cn(
                    'border rounded-lg p-4',
                    isStreaming && index === data.exercises.length - 1 && 'animate-in slide-in-from-left duration-500'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{exercise.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{exercise.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'px-2 py-1 text-xs rounded-full border',
                        DIFFICULTY_COLORS[exercise.difficulty]
                      )}>
                        {exercise.difficulty}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {exercise.estimatedTime}min
                      </span>
                    </div>
                  </div>

                  {exercise.instructions && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium mb-2">Instructions:</h4>
                      <div className="space-y-1">
                        {exercise.instructions.map((instruction, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-muted-foreground">{idx + 1}.</span>
                            <span>{instruction}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" className="gap-2">
                      <Play className="h-3 w-3" />
                      Start Exercise
                    </Button>
                    {exercise.hints && exercise.hints.length > 0 && (
                      <Button variant="outline" size="sm">
                        Show Hints ({exercise.hints.length})
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Progress Summary */}
        <section className="bg-muted/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Progress Overview</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">0%</div>
              <div className="text-sm text-muted-foreground">Completion</div>
              <Progress value={0} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{data.estimatedHours}h</div>
              <div className="text-sm text-muted-foreground">Est. Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{data.objectives?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Objectives</div>
            </div>
          </div>
        </section>

        {/* Streaming Indicator */}
        {isStreaming && (
          <div className="fixed bottom-6 right-6 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
              <span className="text-sm font-medium">Building skill details...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}