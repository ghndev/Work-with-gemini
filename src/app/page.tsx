import UserMenu from '@/components/UserMenu';
import PuzzleApp from '@/components/PuzzleApp';

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 relative">
      <div className="absolute top-6 right-6 z-10">
        <UserMenu />
      </div>
      <PuzzleApp />
    </main>
  );
}