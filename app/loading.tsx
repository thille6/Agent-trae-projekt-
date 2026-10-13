export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-border bg-surface px-6 py-8 shadow-card">
          <div className="h-5 w-52 rounded-full bg-panel" />
          <div className="mt-5 h-12 w-full max-w-3xl rounded-2xl bg-panel" />
          <div className="mt-4 h-7 w-full max-w-2xl rounded-2xl bg-panel" />
        </section>
        <section className="mt-6 grid gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[28px] border border-border bg-surface p-5 shadow-card"
            >
              <div className="h-6 w-44 rounded-full bg-panel" />
              <div className="mt-5 h-20 rounded-3xl bg-panel" />
              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                <div className="h-28 rounded-3xl bg-panel" />
                <div className="h-28 rounded-3xl bg-panel" />
                <div className="h-28 rounded-3xl bg-panel" />
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
