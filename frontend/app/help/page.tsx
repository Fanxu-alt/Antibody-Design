import Navbar from "../components/Navbar";

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <section className="mx-auto max-w-6xl px-8 py-12">
        <div className="rounded-3xl border bg-white p-10 shadow-sm">
          <h1 className="mb-4 text-4xl font-bold">
            SPACE Antibody Design Help
          </h1>

          <p className="mb-8 text-lg leading-8 text-slate-600">
            SPACE helps you generate antibody CDRH3 candidates, predict antibody-antigen binding, evaluate
            developability risks, and prioritize candidates.
          </p>

          <div className="mb-10 rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <h2 className="mb-3 text-2xl font-bold text-blue-900">
              Getting Started
            </h2>

            <div className="rounded-xl bg-white p-6 text-sm leading-7 text-slate-700">
              <p>
                <strong>Step 1.</strong> Choose a target antigen.
              </p>
              <p>
                <strong>Step 2.</strong> Paste the antigen amino-acid sequence.
              </p>
              <p>
                <strong>Step 3.</strong> Generate CDRH3 candidates.
              </p>
              <p>
                <strong>Step 4.</strong> Predict antibody-antigen binding.
              </p>
              <p>
                <strong>Step 5.</strong> Check developability risks.
              </p>
              <p>
                <strong>Step 6.</strong> Download the best candidates.
              </p>
            </div>

            <p className="mt-4 text-sm leading-7 text-blue-900">
              
            </p>
          </div>

          <h2 className="mb-4 text-2xl font-bold">1. Which module should I use?</h2>

          <div className="mb-10 overflow-x-auto rounded-2xl border">
            <table className="w-full border-collapse bg-white text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="border-b p-4">What you want to do</th>
                  <th className="border-b p-4">Use this module</th>
                  <th className="border-b p-4">What you will get</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className="border-b p-4">
                    Design new CDRH3 sequences for an antigen
                  </td>
                  <td className="border-b p-4 font-semibold text-blue-700">
                    Generate
                  </td>
                  <td className="border-b p-4">
                    A list of generated CDRH3 candidates
                  </td>
                </tr>

                <tr>
                  <td className="border-b p-4">
                    Test whether an antibody sequence may bind an antigen
                  </td>
                  <td className="border-b p-4 font-semibold text-blue-700">
                    Predict Binding
                  </td>
                  <td className="border-b p-4">
                    Binding probability and binding logit
                  </td>
                </tr>

                <tr>
                  <td className="border-b p-4">
                    Check whether a candidate has sequence liabilities
                  </td>
                  <td className="border-b p-4 font-semibold text-blue-700">
                    Developability
                  </td>
                  <td className="border-b p-4">
                    Risk score, hard-filter result, and liability reasons
                  </td>
                </tr>

                <tr>
                  <td className="border-b p-4">
                    Let the platform automatically search for acceptable
                    candidates
                  </td>
                  <td className="border-b p-4 font-semibold text-blue-700">
                    LLM-guided Antibody Design
                  </td>
                  <td className="border-b p-4">
                    Selected candidates and full search history
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="mb-4 text-2xl font-bold">2. Supported antigen groups</h2>

          <p className="mb-4 leading-7 text-slate-700">
            SPACE currently supports target selection for the following antigen
            groups. You can choose a target from the dropdown menu in each
            module.
          </p>

          <ul className="mb-10 list-disc space-y-2 pl-6 text-slate-700">
            <li>HIV gp120</li>
            <li>HIV gp160</li>
            <li>Influenza hemagglutinin (HA)</li>
            <li>Influenza neuraminidase (NA)</li>
            <li>Plasmodium circumsporozoite protein (CSP)</li>
            <li>SARS-CoV-2 spike and variants</li>
          </ul>

          <h2 id="generate" className="mb-4 scroll-mt-28 text-2xl font-bold">
            3. Generate Module
          </h2>

          <p className="mb-4 leading-7 text-slate-700">
             
          </p>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-slate-50 p-5">
              <h3 className="mb-2 font-bold">What you need</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                <li>Target antigen name</li>
                <li>Antigen amino-acid sequence</li>
                <li>Number of CDRH3 candidates to generate</li>
              </ul>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-5">
              <h3 className="mb-2 font-bold">What to click</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                <li>Select a target antigen</li>
                <li>Paste the antigen sequence</li>
                <li>Click Generate CDRH3</li>
                <li>Download CSV if needed</li>
              </ul>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-5">
              <h3 className="mb-2 font-bold">What you get</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                <li>Generated CDRH3 sequences</li>
                <li>Predicted CDRH3 length</li>
                <li>Sampling information</li>
              </ul>
            </div>
          </div>

          <h3 className="mb-3 text-xl font-semibold">Recommended settings</h3>

          <div className="mb-6 overflow-x-auto rounded-2xl border">
            <table className="w-full border-collapse bg-white text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="border-b p-4">Parameter</th>
                  <th className="border-b p-4">Recommended value</th>
                  <th className="border-b p-4">Meaning</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className="border-b p-4">Number of samples</td>
                  <td className="border-b p-4">32 to 100</td>
                  <td className="border-b p-4">
                    More samples give more diversity but take longer to process.
                  </td>
                </tr>

                <tr>
                  <td className="border-b p-4">Minimum CDRH3 length</td>
                  <td className="border-b p-4">8</td>
                  <td className="border-b p-4">
                    Avoids very short CDRH3 candidates.
                  </td>
                </tr>

                <tr>
                  <td className="border-b p-4">Sampling mode</td>
                  <td className="border-b p-4">sample</td>
                  <td className="border-b p-4">
                    Produces more diverse candidates.
                  </td>
                </tr>

                <tr>
                  <td className="border-b p-4">Temperature</td>
                  <td className="border-b p-4">1.0</td>
                  <td className="border-b p-4">
                    Higher values increase diversity; lower values make
                    generation more conservative.
                  </td>
                </tr>

                <tr>
                  <td className="border-b p-4">Deduplication</td>
                  <td className="border-b p-4">On</td>
                  <td className="border-b p-4">
                    Removes repeated CDRH3 sequences.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mb-10 leading-7 text-slate-700">
            After generation, go to the Predict Binding Module to estimate which
            generated candidates are more likely to bind the antigen.
          </p>

          <h2 id="predict" className="mb-4 scroll-mt-28 text-2xl font-bold">
            4. Predict Binding Module
          </h2>

          <p className="mb-4 leading-7 text-slate-700">
            Use this module to estimate whether an antibody heavy-chain sequence
            is likely to bind the selected antigen. You can either use generated
            candidates from the Generate Module or paste your own antibody
            sequence manually.
          </p>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-slate-50 p-5">
              <h3 className="mb-2 font-bold">What you need</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                <li>Target antigen name</li>
                <li>Antigen sequence</li>
                <li>Heavy-chain sequence</li>
              </ul>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-5">
              <h3 className="mb-2 font-bold">What to click</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                <li>Select Generated Candidates or Manual Sequence</li>
                <li>Click Predict Selected</li>
              </ul>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-5">
              <h3 className="mb-2 font-bold">What you get</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                <li>Binding probability</li>
                <li>Binding logit</li>
                <li>Ranked prediction table</li>
              </ul>
            </div>
          </div>

          <h3 className="mb-3 text-xl font-semibold">
            How to interpret binding probability
          </h3>

          <div className="mb-6 overflow-x-auto rounded-2xl border">
            <table className="w-full border-collapse bg-white text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="border-b p-4">Binding probability</th>
                  <th className="border-b p-4">Interpretation</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className="border-b p-4 font-semibold">≥ 0.90</td>
                  <td className="border-b p-4">Very strong computational candidate</td>
                </tr>

                <tr>
                  <td className="border-b p-4 font-semibold">0.80 to 0.90</td>
                  <td className="border-b p-4">Good computational candidate</td>
                </tr>

                <tr>
                  <td className="border-b p-4 font-semibold">0.60 to 0.80</td>
                  <td className="border-b p-4">Moderate candidate</td>
                </tr>

                <tr>
                  <td className="border-b p-4 font-semibold">&lt; 0.60</td>
                  <td className="border-b p-4">Lower-priority candidate</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mb-10 leading-7 text-slate-700">
            Binding prediction alone is not enough. Therefore,
            high-binding candidates should be checked in the Developability
            Module.
          </p>

          <h2 id="developability" className="mb-4 scroll-mt-28 text-2xl font-bold">
            5. Developability Module
          </h2>

          <p className="mb-4 leading-7 text-slate-700">
            Use this module to identify sequence features that may cause
            problems during antibody expression, purification, or storage.
          </p>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-slate-50 p-5">
              <h3 className="mb-2 font-bold">What you need</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                <li>Target antigen name</li>
                <li>Candidate CDRH3 sequence</li>
                <li>Candidate heavy-chain sequence</li>
              </ul>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-5">
              <h3 className="mb-2 font-bold">What you get</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                <li>Hard-filter pass or fail</li>
                <li>Risk score and percentile</li>
                <li>Reasons for sequence liabilities</li>
              </ul>
            </div>
          </div>

          <h3 className="mb-3 text-xl font-semibold">
            What do the developability metrics mean?
          </h3>

          <div className="mb-6 overflow-x-auto rounded-2xl border">
            <table className="w-full border-collapse bg-white text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="border-b p-4">Metric</th>
                  <th className="border-b p-4">Why it matters</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className="border-b p-4 font-semibold">Hard filter pass</td>
                  <td className="border-b p-4">
                    A quick yes/no flag for whether the sequence avoids major
                    predefined liabilities.
                  </td>
                </tr>

                <tr>
                  <td className="border-b p-4 font-semibold">
                    Hard filter reasons
                  </td>
                  <td className="border-b p-4">
                    Explains why a candidate failed, such as extra cysteines,
                    long hydrophobic runs, or problematic motifs.
                  </td>
                </tr>

                <tr>
                  <td className="border-b p-4 font-semibold">
                    Developability risk score
                  </td>
                  <td className="border-b p-4">
                    Lower values generally indicate lower predicted sequence
                    risk.
                  </td>
                </tr>

                <tr>
                  <td className="border-b p-4 font-semibold">Risk percentile</td>
                  <td className="border-b p-4">
                    Shows how risky the candidate is compared with reference
                    antibodies for a similar antigen group.
                  </td>
                </tr>

                <tr>
                  <td className="border-b p-4 font-semibold">Hydrophobicity</td>
                  <td className="border-b p-4">
                    Highly hydrophobic sequences may have solubility or
                    aggregation problems.
                  </td>
                </tr>

                <tr>
                  <td className="border-b p-4 font-semibold">Extra cysteine</td>
                  <td className="border-b p-4">
                    Extra cysteines may form unwanted disulfide bonds.
                  </td>
                </tr>

                <tr>
                  <td className="border-b p-4 font-semibold">
                    N-linked glycosylation motif
                  </td>
                  <td className="border-b p-4">
                    May introduce unwanted glycosylation sites.
                  </td>
                </tr>

                <tr>
                  <td className="border-b p-4 font-semibold">
                    Deamidation or isomerization motif
                  </td>
                  <td className="border-b p-4">
                    May reduce long-term stability or alter antibody quality.
                  </td>
                </tr>

                <tr>
                  <td className="border-b p-4 font-semibold">
                    Nearest-neighbor distance
                  </td>
                  <td className="border-b p-4">
                    Helps estimate novelty compared with known same-antigen
                    antibody sequences.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 id="llm-guided-design" className="mb-4 scroll-mt-28 text-2xl font-bold">
            6. LLM-guided Antibody Design Module
          </h2>

          <p className="mb-4 leading-7 text-slate-700">
            The system repeatedly generates candidates, predicts binding,
            checks developability, and keeps candidates that satisfy your
            settings.
          </p>

          <div className="mb-6 rounded-xl bg-slate-100 p-6 text-sm leading-7 text-slate-700">
            <p>
              <strong>User settings</strong>
            </p>
            <p>↓</p>
            <p>Generate candidate CDRH3 sequences</p>
            <p>↓</p>
            <p>Predict binding probability</p>
            <p>↓</p>
            <p>Evaluate developability</p>
            <p>↓</p>
            <p>Enough acceptable candidates?</p>
            <p>↓</p>
            <p>
              <strong>Yes:</strong> finish and return selected candidates
            </p>
            <p>
              <strong>No:</strong> adjust search strategy and continue
            </p>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-slate-50 p-5">
              <h3 className="mb-2 font-bold">What you need</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                <li>Target antigen name</li>
                <li>Antigen sequence</li>
                <li>Heavy-chain template</li>
                <li>Template CDRH3</li>
              </ul>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-5">
              <h3 className="mb-2 font-bold">Main settings</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                <li>Desired candidates: start with 5</li>
                <li>Minimum binding: start with 0.80</li>
                <li>Max rounds: start with 3 to 4</li>
              </ul>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-5">
              <h3 className="mb-2 font-bold">What you get</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                <li>Selected candidates</li>
                <li>Full search history</li>
                <li>Design summary</li>
                <li>Downloadable CSV files</li>
              </ul>
            </div>
          </div>

          <p className="mb-10 leading-7 text-slate-700">
            If the search gets slow, reduce Desired candidates or Max rounds.
          </p>

          <h2 className="mb-4 text-2xl font-bold">7. Downloadable outputs</h2>

          <ul className="mb-10 list-disc space-y-2 pl-6 text-slate-700">
            <li>
              <strong>generated_cdrh3_candidates.csv:</strong> generated CDRH3
              candidates from the Generate module.
            </li>
            <li>
              <strong>binding_prediction_results.csv:</strong> predicted binding
              probabilities and logits.
            </li>
            <li>
              <strong>developability_results.csv:</strong> developability risk,
              hard-filter status, and liability reasons.
            </li>
            <li>
              <strong>llm_guided_design_selected_candidates.csv:</strong>{" "}
              candidates selected by the LLM-guided design workflow.
            </li>
            <li>
              <strong>llm_guided_design_search_history.csv:</strong> all
              evaluated candidates during the LLM-guided search.
            </li>
            <li>
              <strong>llm_guided_design_summary.txt:</strong> text summary of
              the LLM-guided design run.
            </li>
          </ul>

        </div>
      </section>
    </main>
  );
}
