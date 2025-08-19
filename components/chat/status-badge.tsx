import { CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusType = 'pending' | 'running' | 'success' | 'error' | 'warning';

interface StatusBadgeProps {
  status: StatusType;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    colors: 'bg-gray-100 text-gray-700 border-gray-200',
    iconColors: 'text-gray-500'
  },
  running: {
    icon: Loader2,
    colors: 'bg-blue-100 text-blue-700 border-blue-200',
    iconColors: 'text-blue-500'
  },
  success: {
    icon: CheckCircle,
    colors: 'bg-green-100 text-green-700 border-green-200',
    iconColors: 'text-green-500'
  },
  error: {
    icon: XCircle,
    colors: 'bg-red-100 text-red-700 border-red-200',
    iconColors: 'text-red-500'
  },
  warning: {
    icon: AlertCircle,
    colors: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    iconColors: 'text-yellow-500'
  }
};

const sizeConfig = {
  sm: {
    container: 'px-2 py-1 text-xs',
    icon: 'h-3 w-3'
  },
  md: {
    container: 'px-3 py-1.5 text-sm',
    icon: 'h-4 w-4'
  },
  lg: {
    container: 'px-4 py-2 text-base',
    icon: 'h-5 w-5'
  }
};

export function StatusBadge({ status, text, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyle = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div className={cn(
      "inline-flex items-center gap-2 rounded-full border font-medium transition-all duration-200",
      config.colors,
      sizeStyle.container,
      className
    )}>
      <Icon className={cn(
        sizeStyle.icon,
        config.iconColors,
        status === 'running' && "animate-spin"
      )} />
      <span>{text || status.charAt(0).toUpperCase() + status.slice(1)}</span>
    </div>
  );
}
