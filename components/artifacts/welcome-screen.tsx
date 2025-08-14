'use client';

import { Map, Target, Play, BarChart3, Zap, BookOpen, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURES = [
  {
    icon: Map,
    title: 'Interactive Mind Maps',
    description: 'Visualize learning paths as interactive mind maps that update in real-time as AI generates content.',
  },
  {
    icon: Target,
    title: 'Skill Atoms',
    description: 'Break down complex skills into atomic units with clear objectives, resources, and assessments.',
  },
  {
    icon: Play,
    title: 'Practice Drills',
    description: 'Generate interactive drills and exercises tailored to specific learning objectives.',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Monitor learning progress with detailed analytics and personalized recommendations.',
  },
];

const EXAMPLES = [
  {
    icon: '🚀',
    title: 'JavaScript Fundamentals',
    description: 'Create a comprehensive JavaScript course for beginners',
  },
  {
    icon: '🎨',
    title: 'UI/UX Design Principles',
    description: 'Build a design thinking workshop curriculum',
  },
  {
    icon: '📊',
    title: 'Data Science Pipeline',
    description: 'Design a hands-on data science learning path',
  },
  {
    icon: '🤖',
    title: 'Machine Learning Basics',
    description: 'Structure an ML course with practical projects',
  },
];

export function WelcomeScreen() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            AI Learning Path Creator
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your expertise into comprehensive learning experiences. 
            Watch as AI builds interactive mind maps, skill atoms, and practice drills in real-time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2">
              <BookOpen className="h-5 w-5" />
              Start Creating
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              <Users className="h-5 w-5" />
              View Examples
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-center mb-8">
            Powerful Learning Path Tools
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((feature, index) => (
              <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg shrink-0">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Example Prompts */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-center mb-8">
            Try These Examples
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {EXAMPLES.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 text-left justify-start hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 w-full">
                  <span className="text-2xl">{example.icon}</span>
                  <div>
                    <div className="font-semibold mb-1">{example.title}</div>
                    <div className="text-sm text-muted-foreground">{example.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Simply describe the skill or topic you want to teach in the chat panel. 
            Watch as AI creates a comprehensive learning path with interactive visualizations, 
            detailed skill breakdowns, and practice exercises.
          </p>
          
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Real-time generation • Interactive visualizations • Export ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}