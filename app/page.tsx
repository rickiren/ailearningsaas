import { SplitLayout } from '@/components/layout/split-layout';
import { WelcomeScreen } from '@/components/artifacts/welcome-screen';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { Navigation } from '@/components/layout/navigation';

export default function Home() {
  return (
    <div className="h-screen flex flex-col">
      <Navigation />
      <div className="flex-1">
        <SplitLayout
          leftPanel={<WelcomeScreen />}
          rightPanel={<ChatSidebar />}
        />
      </div>
    </div>
  );
}
