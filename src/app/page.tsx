import LoginButton from "@/components/LoginButton";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
          Spotify Music Map
        </h1>
        <p className="text-xl text-gray-400 max-w-md">
          Visualize your music library like never before. Explore genres, eras, and your taste evolution.
        </p>

        <LoginButton />
      </main>
    </div>
  );
}
