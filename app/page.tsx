import { SplitLayout } from '@/components/layout/split-layout';
import { ArtifactViewer } from '@/components/artifacts/artifact-viewer';
import { ChatSidebar } from '@/components/chat/chat-sidebar';

export default function Home() {
  return (
    <SplitLayout
      leftPanel={<ArtifactViewer />}
      rightPanel={<ChatSidebar />}
    />
  );
}
