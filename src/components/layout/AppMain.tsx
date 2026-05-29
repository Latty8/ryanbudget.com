export function AppMain({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-[1068px] flex-1 px-5 py-8 sm:px-8 sm:py-14 lg:py-16">
      {children}
    </main>
  );
}
