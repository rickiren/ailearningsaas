import { DrillsPage } from '@/components/drills/drills-page';
import { Navigation } from '@/components/layout/navigation';

export default function Drills() {
  return (
    <div className="h-screen flex flex-col">
      <Navigation />
      <div className="flex-1">
        <DrillsPage />
      </div>
    </div>
  );
}
