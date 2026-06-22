import Navbar from "./components/Navbar";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <section className="mx-auto max-w-7xl px-8 py-16">
        <div className="rounded-3xl border bg-white p-10 shadow-sm">
          <h1 className="mb-6 text-5xl font-bold tracking-tight">
            SPACE Antibody Design
          </h1>

          <p className="max-w-4xl text-lg leading-8 text-slate-600">
            SPACE is a sequence-based antibody design platform for
            antigen-specific CDRH3 generation, antibody-antigen binding
            prediction, developability-aware ranking, and LLM-guided antibody
            design.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border bg-slate-50 p-6">
              <div className="text-3xl font-bold text-blue-700">65</div>
              <div className="mt-2 text-sm text-slate-600">
                Target antigens
              </div>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-6">
              <div className="text-3xl font-bold text-blue-700">6</div>
              <div className="mt-2 text-sm text-slate-600">
                Antigen families
              </div>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-6">
              <div className="text-3xl font-bold text-blue-700">16K+</div>
              <div className="mt-2 text-sm text-slate-600">
                Reference antibodies
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <a
              href="/generate"
              className="rounded-2xl border bg-white p-6 shadow-sm hover:border-blue-500"
            >
              <h2 className="text-xl font-bold">Generate</h2>
              <p className="mt-2 text-sm text-slate-600">
                Generate antigen-conditioned CDRH3 candidates.
              </p>
            </a>

            <a
              href="/predict"
              className="rounded-2xl border bg-white p-6 shadow-sm hover:border-blue-500"
            >
              <h2 className="text-xl font-bold">Predict</h2>
              <p className="mt-2 text-sm text-slate-600">
                Predict antibody-antigen binding probability.
              </p>
            </a>

            <a
              href="/developability"
              className="rounded-2xl border bg-white p-6 shadow-sm hover:border-blue-500"
            >
              <h2 className="text-xl font-bold">Developability</h2>
              <p className="mt-2 text-sm text-slate-600">
                Rank candidates using developability-aware criteria.
              </p>
            </a>

            <a
              href="/agent"
              className="rounded-2xl border bg-white p-6 shadow-sm hover:border-blue-500"
            >
              <h2 className="text-xl font-bold">
                LLM-guided Antibody Design
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Run closed-loop antibody design with generation, prediction,
                developability assessment, and result interpretation.
              </p>
            </a>
          </div>
        </div>

        <footer className="mt-12 rounded-3xl border bg-white p-8 text-sm leading-7 text-slate-600 shadow-sm">
          <p>
            National Institute of Health Data Science of China, Shandong
            University, Jinan 250100, China
          </p>

          <p className="mt-4">
            Contact: Prof. Qingzhen Hou,{" "}
            <a
              href="mailto:houqingzhen@sdu.edu.cn"
              className="text-blue-700 hover:underline"
            >
              houqingzhen@sdu.edu.cn
            </a>
            <br />
            Fanxu Meng,{" "}
            <a
              href="mailto:f.meng@vu.nl"
              className="text-blue-700 hover:underline"
            >
              f.meng@vu.nl
            </a>
          </p>
        </footer>
      </section>
    </main>
  );
}
