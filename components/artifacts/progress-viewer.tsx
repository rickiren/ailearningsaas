'use client';

import { BarChart3, TrendingUp, Clock, Target, CheckCircle, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressViewerProps {
  data: any;
  isStreaming?: boolean;
}

const MOCK_PROGRESS_DATA = {
  overallProgress: 65,
  totalHours: 120,
  completedHours: 78,
  skillsLearned: 12,
  totalSkills: 18,
  streakDays: 7,
  achievements: [
    { id: 1, title: 'First Steps', description: 'Completed your first lesson', earned: true },
    { id: 2, title: 'Week Warrior', description: 'Learned for 7 days straight', earned: true },
    { id: 3, title: 'Skill Master', description: 'Completed 10 skills', earned: true },
    { id: 4, title: 'Speed Learner', description: 'Complete 5 lessons in one day', earned: false },
  ],
  recentActivity: [
    { date: '2024-01-15', skill: 'JavaScript Functions', progress: 100, type: 'completed' },
    { date: '2024-01-14', skill: 'Variables and Data Types', progress: 100, type: 'completed' },
    { date: '2024-01-13', skill: 'Setting up Development Environment', progress: 100, type: 'completed' },
    { date: '2024-01-12', skill: 'Introduction to Programming', progress: 85, type: 'in-progress' },
  ],
  skillProgress: [
    { name: 'JavaScript Basics', progress: 100, level: 'beginner' },
    { name: 'DOM Manipulation', progress: 80, level: 'intermediate' },
    { name: 'Async Programming', progress: 45, level: 'intermediate' },
    { name: 'React Fundamentals', progress: 20, level: 'intermediate' },
    { name: 'Node.js Basics', progress: 0, level: 'advanced' },
  ]
};

export function ProgressViewer({ data, isStreaming }: ProgressViewerProps) {
  const progressData = data || MOCK_PROGRESS_DATA;

  if (!progressData) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/10">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Progress Data</h3>
          <p className="text-muted-foreground">
            Start learning to see your progress here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Learning Progress</h1>
          <p className="text-muted-foreground">
            Track your journey and celebrate your achievements
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overall Progress</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary mb-1">
              {progressData.overallProgress}%
            </div>
            <Progress value={progressData.overallProgress} className="h-2" />
          </div>

          <div className="bg-background border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Time Invested</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mb-1">
              {progressData.completedHours}h
            </div>
            <div className="text-sm text-muted-foreground">
              of {progressData.totalHours}h total
            </div>
          </div>

          <div className="bg-background border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Skills Mastered</span>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mb-1">
              {progressData.skillsLearned}
            </div>
            <div className="text-sm text-muted-foreground">
              of {progressData.totalSkills} skills
            </div>
          </div>

          <div className="bg-background border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Current Streak</span>
              <Star className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold mb-1">
              {progressData.streakDays}
            </div>
            <div className="text-sm text-muted-foreground">days</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Skill Progress */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Skill Progress</h2>
            <div className="space-y-4">
              {progressData.skillProgress?.map((skill: any, index: number) => (
                <div
                  key={index}
                  className={cn(
                    'bg-background border rounded-lg p-4',
                    isStreaming && index === progressData.skillProgress.length - 1 && 'animate-in slide-in-from-left duration-500'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{skill.name}</div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        skill.level === 'beginner' && 'bg-green-100 text-green-700',
                        skill.level === 'intermediate' && 'bg-yellow-100 text-yellow-700',
                        skill.level === 'advanced' && 'bg-red-100 text-red-700'
                      )}>
                        {skill.level}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {skill.progress}%
                      </span>
                    </div>
                  </div>
                  <Progress value={skill.progress} className="h-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity & Achievements */}
          <div className="space-y-8">
            {/* Achievements */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Achievements</h2>
              <div className="grid grid-cols-2 gap-3">
                {progressData.achievements?.map((achievement: any, index: number) => (
                  <div
                    key={achievement.id}
                    className={cn(
                      'border rounded-lg p-3 text-center transition-all',
                      achievement.earned 
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
                        : 'bg-muted/50 border-dashed',
                      isStreaming && index === progressData.achievements.length - 1 && 'animate-in zoom-in-50 duration-500'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center',
                      achievement.earned ? 'bg-yellow-500' : 'bg-muted-foreground'
                    )}>
                      <Star className="h-4 w-4 text-white" />
                    </div>
                    <div className="font-medium text-sm mb-1">{achievement.title}</div>
                    <div className="text-xs opacity-75">{achievement.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {progressData.recentActivity?.map((activity: any, index: number) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-3 p-3 bg-background border rounded-lg',
                      isStreaming && index === 0 && 'animate-in slide-in-from-right duration-500'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      activity.type === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
                    )}>
                      <CheckCircle className={cn(
                        'h-4 w-4',
                        activity.type === 'completed' ? 'text-green-600' : 'text-yellow-600'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{activity.skill}</div>
                      <div className="text-xs text-muted-foreground">{activity.date}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {activity.progress}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Streaming Indicator */}
        {isStreaming && (
          <div className="fixed bottom-6 right-6 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
              <span className="text-sm font-medium">Updating progress...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}