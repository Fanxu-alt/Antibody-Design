import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 text-white">
        <div className="mx-auto max-w-7xl px-8 py-24">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">
            SPACE
          </p>

          <h1 className="mb-6 max-w-4xl text-5xl font-bold leading-tight md:text-6xl">
            Antibody Design
          </h1>

          <p className="mb-8 max-w-4xl text-lg leading-8 text-blue-100">
            SPACE is a sequence-based antibody design platform integrating
            antigen-conditioned CDRH3 generation, antibody-antigen binding
            prediction, developability-aware candidate prioritization.
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href="/generate"
              className="rounded-full bg-white px-6 py-3 font-semibold text-blue-900 shadow"
            >
              Start generating
            </a>

          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-8 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {[
            ["65", "Target cohorts"],
        
            ["6", "Antigen groups"],
           
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-2xl border bg-white p-6 text-center shadow-sm"
            >
              <div className="text-3xl font-bold text-blue-700">{value}</div>
              <div className="mt-2 text-sm text-slate-600">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold">Supported antigen groups</h2>
          <div className="grid gap-3 text-slate-700 md:grid-cols-3">
            <p>• SARS-CoV-2</p>
            <p>• HIV gp120</p>
            <p>• HIV gp160</p>
            <p>• Influenza Hemagglutinin</p>
            <p>• Influenza Neuraminidase</p>
            <p>• Plasmodium CSP</p>
          </div>
        </div>
      </section>
    </main>
  );
}
