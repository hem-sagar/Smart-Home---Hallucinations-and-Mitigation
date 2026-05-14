export default function AppShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
