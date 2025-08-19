'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Target, Code, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navigation() {
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'Learning Path',
      href: '/',
      icon: Home,
      description: 'Build your learning journey'
    },
    {
      name: 'Drills',
      href: '/drills',
      icon: Target,
      description: 'Create interactive exercises'
    },
    {
      name: 'zero280',
      href: '/zero280',
      icon: Code,
      description: 'Clean AI chat interface'
    },
    {
      name: 'Progress Demo',
      href: '/test-progress',
      icon: Code,
      description: 'Test progress indicators'
    },
    {
      name: 'Context Demo',
      href: '/context-demo',
      icon: Code,
      description: 'Context awareness system'
    },
    {
      name: 'Workflow Demo',
      href: '/workflow-demo',
      icon: Code,
      description: 'Multi-tool execution system'
    },
    {
      name: 'NLU Demo',
      href: '/nlu-demo',
      icon: Brain,
      description: 'Natural language understanding system'
    }
  ];

  return (
    <nav className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Code className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold">AI Learning Path</span>
            </div>
          </div>
          
          <div className="flex space-x-8">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
