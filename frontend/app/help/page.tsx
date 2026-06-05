import Navbar from "../components/Navbar";

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <section className="mx-auto max-w-5xl px-8 py-12">
        <div className="rounded-3xl border bg-white p-10 shadow-sm">
          <h1 className="mb-4 text-4xl font-bold">
            SPACE Antibody Design Help
          </h1>

          <p className="mb-10 text-lg text-slate-600">
            SPACE is a sequence-based antibody design platform for
            antigen-specific antibody discovery and optimization.
          </p>

          <h2 className="mb-4 text-2xl font-bold">Overview</h2>

          <ul className="mb-10 list-disc space-y-2 pl-6">
            <li>Antigen-conditioned CDRH3 generation</li>
            <li>Antibody-antigen interaction prediction</li>
            <li>Developability assessment</li>
            <li>LLM-guided antibody design agent</li>
          </ul>

          <h2 className="mb-4 text-2xl font-bold">
            Supported Antigen Groups
          </h2>

          <ul className="mb-10 list-disc space-y-2 pl-6">
            <li>SARS-CoV-2 variants</li>
            <li>HIV gp120</li>
            <li>HIV gp160</li>
            <li>Influenza Hemagglutinin HA</li>
            <li>Influenza Neuraminidase NA</li>
            <li>Plasmodium Circumsporozoite Protein CSP</li>
          </ul>

          <h2 className="mb-4 text-2xl font-bold">Recommended Workflow</h2>

          <div className="mb-10 rounded-xl bg-slate-100 p-6 font-mono">
            Antigen Sequence
            <br />
            ↓
            <br />
            Generate CDRH3
            <br />
            ↓
            <br />
            Predict Binding
            <br />
            ↓
            <br />
            Developability Assessment
            <br />
            ↓
            <br />
            Select Best Candidates
          </div>

          <h2 className="mb-4 text-2xl font-bold">Generate Module</h2>

          <p className="mb-3">
            Generate antigen-specific CDRH3 sequences from an antigen sequence.
          </p>

          <ul className="mb-10 list-disc space-y-2 pl-6">
            <li>Antigen amino-acid sequence</li>
            <li>Number of generated CDRH3 samples</li>
            <li>Minimum CDRH3 length</li>
            <li>Sampling mode</li>
            <li>Generation diversity temperature</li>
            <li>Remove duplicate sequences</li>
          </ul>

          <h2 className="mb-4 text-2xl font-bold">Predict Module</h2>

          <p className="mb-3">
            Predict antibody-antigen interaction strength.
          </p>

          <ul className="mb-10 list-disc space-y-2 pl-6">
            <li>Binding Probability</li>
            <li>Binding Logit</li>
          </ul>

          <div className="mb-10 rounded-xl bg-slate-100 p-4">
            Binding probability &gt; 0.8 means a high-priority candidate.
          </div>

          <h2 className="mb-4 text-2xl font-bold">
            Developability Module
          </h2>

          <p className="mb-3">
            Evaluate manufacturability and sequence quality.
          </p>

          <ul className="mb-10 list-disc space-y-2 pl-6">
            <li>Developability Risk Score</li>
            <li>Risk Percentile</li>
            <li>Hard Filter Pass</li>
          </ul>

          <div className="mb-10 rounded-xl bg-slate-100 p-4">
            Recommended candidates should have high binding probability, low
            developability risk, and hard filter pass = true.
          </div>

          <h2 className="mb-4 text-2xl font-bold">Agent Module</h2>

          <p className="mb-3">
            The Agent performs closed-loop antibody design.
          </p>

          <ol className="mb-10 list-decimal space-y-2 pl-6">
            <li>Generate candidate CDRH3 sequences</li>
            <li>Predict antigen binding</li>
            <li>Evaluate developability</li>
            <li>Select promising candidates</li>
            <li>Optimize iteratively</li>
            <li>Summarize results using an LLM</li>
          </ol>

          <h2 className="mb-4 text-2xl font-bold">
            Downloadable Outputs
          </h2>

          <ul className="mb-10 list-disc space-y-2 pl-6">
            <li>generated_candidates.csv</li>
            <li>binding_predictions.csv</li>
            <li>developability_results.csv</li>
            <li>agent_accepted_candidates.csv</li>
            <li>agent_search_history.csv</li>
            <li>agent_summary.txt</li>
          </ul>

 
        </div>
      </section>
    </main>
  );
}
