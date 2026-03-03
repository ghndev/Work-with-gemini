import UserMenu from '@/components/UserMenu';
import PuzzleApp from '@/components/PuzzleApp';
import { auth } from '@/auth';

export default async function Page() {
  const session = await auth();

  console.log(session?.user?.id);

  return (
    <main className="relative min-h-screen bg-zinc-950 text-zinc-100">
      <div className="absolute top-6 right-6 z-10">
        <UserMenu />
      </div>
      <PuzzleApp />
    </main>
  );
}
