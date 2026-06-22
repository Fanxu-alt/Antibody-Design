import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 text-white">
        <div className="mx-auto max-w-7xl px-8 py-24">
          <h1 className="mb-6 max-w-4xl text-5xl font-bold leading-tight md:text-6xl">
            SPACE
          </h1>

          <p className="mb-8 max-w-4xl text-lg leading-8 text-blue-100">
            SPACE is a sequence-based antibody design platform integrating
            antigen-conditioned CDRH3 generation, antibody-antigen binding
            prediction, developability-aware candidate prioritization, and
            LLM-guided closed-loop optimization.
          </p>

          <a
            href="/generate"
            className="rounded-full bg-white px-6 py-3 font-semibold text-blue-900 shadow"
          >
            Start generating
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-8 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {[
            ["65", "Target antigens"],
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

        <div className="mt-10 rounded-3xl border bg-white p-10 shadow-sm">
          <h2 className="mb-6 text-3xl font-bold">About</h2>

          <p className="mb-6 text-slate-700">
            SPACE is a sequence-based framework for antigen-specific antibody
            design integrating antigen-conditioned CDRH3 generation,
            antibody-antigen interaction prediction, developability assessment,
            and LLM-guided closed-loop optimization.
          </p>

          <div className="space-y-2 text-sm text-slate-700">
            <p>
              <strong>Authors</strong>
            </p>

            <p>
              Fanxu Meng<sup>1,2†</sup>, Han Wang<sup>1,3†</sup>, Na Zhou
              <sup>1,3†</sup>, Mingjie Liu<sup>4</sup>, Minghui Zhao
              <sup>1,3</sup>, Linxinyu Wang<sup>1,3</sup>, K. Anton Feenstra
              <sup>2</sup>, Olga Tsoy<sup>2</sup>, Rachit Kumar<sup>2</sup>,
              Fuzhong Xue<sup>1,3*</sup>, Hongqian Cao<sup>1,3*</sup>,
              Qingzhen Hou<sup>1,3*</sup>
            </p>

            <p>† Equal contribution</p>
            <p>* Corresponding authors</p>
          </div>

          <div className="mt-8 space-y-2 text-sm text-slate-700">
            <p>
              <strong>Affiliations</strong>
            </p>

            <p>
              1. School of Public Health, Cheeloo College of Medicine,
              Shandong University, Jinan 250100, China
            </p>

            <p>
              2. Department of Computer Science, Vrije Universiteit Amsterdam,
              1081HV Amsterdam, The Netherlands
            </p>

            <p>
              3. National Institute of Health Data Science of China, Shandong
              University, Jinan 250100, China
            </p>

            <p>
              4. State Key Laboratory of Discovery and Utilization of
              Functional Components in Traditional Chinese Medicine, Shandong
              University, Jinan, China
            </p>
          </div>

          <div className="mt-8 border-t pt-8">
            <h3 className="mb-3 text-xl font-semibold">Contact</h3>

            <p className="text-slate-700">Fanxu Meng</p>

            <p className="text-slate-700">
              Vrije Universiteit Amsterdam & Shandong University
            </p>

            <p className="text-slate-700">
              Email:{" "}
              <a
                href="mailto:mengzsq22@gmail.com"
                className="font-medium text-blue-700 hover:underline"
              >
                mengzsq22@gmail.com
              </a>
            </p>

            <p className="mt-3 text-sm text-slate-500">
              For questions regarding the SPACE framework, antibody design
              workflow, datasets, or collaboration opportunities, please contact
              the authors.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
