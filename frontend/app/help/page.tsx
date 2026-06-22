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
            SPACE is a sequence-based antibody design platform for
            antigen-specific antibody discovery. It integrates antigen-conditioned
            CDRH3 generation, antibody-antigen binding prediction,
            developability-aware candidate ranking, and an optional
            LLM-guided design controller. The platform is intended for early-stage
            computational screening and prioritization of antibody candidates.
          </p>

          <div className="mb-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
            <strong>Important note:</strong> SPACE predictions are computational
            estimates. Candidates selected by the platform should be validated
            experimentally before biological or therapeutic interpretation.
          </div>

          <h2 className="mb-4 text-2xl font-bold">1. Overview</h2>

          <p className="mb-4 leading-7 text-slate-700">
            SPACE operates directly in antibody sequence space. Given an antigen
            amino-acid sequence, the platform can generate CDRH3 candidates,
            graft them into a heavy-chain scaffold, predict antibody-antigen
            binding probability, evaluate sequence-level developability
            properties, and rank candidates for downstream validation.
          </p>

          <ul className="mb-10 list-disc space-y-2 pl-6 text-slate-700">
            <li>
              <strong>Generate:</strong> produces antigen-conditioned CDRH3
              sequences.
            </li>
            <li>
              <strong>Predict Binding:</strong> estimates antibody-antigen
              compatibility using AbAgBinder.
            </li>
            <li>
              <strong>Developability:</strong> evaluates sequence liabilities,
              physicochemical properties, and novelty.
            </li>
            <li>
              <strong>Full Pipeline:</strong> combines generation, binding
              prediction, and developability ranking.
            </li>
            <li>
              <strong>LLM Controller:</strong> performs iterative candidate search using
              binding and developability constraints.
            </li>
          </ul>

          <h2 className="mb-4 text-2xl font-bold">2. Supported Antigen Groups</h2>

          <p className="mb-4 leading-7 text-slate-700">
            The current platform supports antigen-associated antibody datasets
            used for model training, evaluation, and developability reference
            cohorts. Other antigen sequences can also be submitted, but
            developability percentile estimates are most meaningful when a
            matching reference cohort is available.
          </p>

          <ul className="mb-10 list-disc space-y-2 pl-6 text-slate-700">
            <li>SARS-CoV-2 spike and variants</li>
            <li>HIV gp120</li>
            <li>HIV gp160</li>
            <li>Influenza hemagglutinin (HA)</li>
            <li>Influenza neuraminidase (NA)</li>
            <li>Plasmodium circumsporozoite protein (CSP)</li>
          </ul>

          <h2 className="mb-4 text-2xl font-bold">3. Recommended Workflow</h2>

          <div className="mb-6 rounded-xl bg-slate-100 p-6 font-mono text-sm leading-7">
            Antigen sequence
            <br />
            ↓
            <br />
            Generate antigen-conditioned CDRH3 candidates
            <br />
            ↓
            <br />
            Graft CDRH3 into a heavy-chain scaffold
            <br />
            ↓
            <br />
            Predict antibody-antigen binding probability
            <br />
            ↓
            <br />
            Evaluate developability and sequence novelty
            <br />
            ↓
            <br />
            Rank candidates
            <br />
            ↓
            <br />
            Select candidates for experimental validation
          </div>

          <p className="mb-10 leading-7 text-slate-700">
            In general, candidates with high predicted binding probability,
            hard-filter pass status, low developability risk, and sufficient
            sequence novelty should be prioritized.
          </p>

          <h2 className="mb-4 text-2xl font-bold">4. Generate Module</h2>

          <p className="mb-4 leading-7 text-slate-700">
            The Generate module uses H3-AbSeqVAE to produce antigen-conditioned
            CDRH3 sequences. The model samples from a latent sequence space
            learned from antibody repertoires and conditioned on antigen-derived
            information.
          </p>

          <h3 className="mb-3 text-xl font-semibold">Inputs</h3>

          <ul className="mb-6 list-disc space-y-2 pl-6 text-slate-700">
            <li>
              <strong>Antigen sequence:</strong> amino-acid sequence of the
              target antigen.
            </li>
            <li>
              <strong>Number of samples:</strong> number of CDRH3 candidates to
              generate.
            </li>
            <li>
              <strong>Minimum CDRH3 length:</strong> lower bound for generated
              CDRH3 length.
            </li>
            <li>
              <strong>Sampling mode:</strong> stochastic sampling is recommended
              for diversity.
            </li>
            <li>
              <strong>Temperature:</strong> controls generation diversity.
              Higher values increase diversity but may reduce sequence realism.
            </li>
            <li>
              <strong>Deduplication:</strong> removes repeated CDRH3 sequences.
            </li>
          </ul>

          <h3 className="mb-3 text-xl font-semibold">Outputs</h3>

          <ul className="mb-10 list-disc space-y-2 pl-6 text-slate-700">
            <li>Generated CDRH3 sequence</li>
            <li>Sequence length</li>
            <li>Optional generation metadata</li>
          </ul>

          <h2 className="mb-4 text-2xl font-bold">5. Predict Binding Module</h2>

          <p className="mb-4 leading-7 text-slate-700">
            The Predict module uses AbAgBinder to estimate the probability of
            antibody-antigen binding from sequence information. The model accepts
            an antibody heavy-chain sequence and an antigen sequence, then
            returns a binding logit and probability.
          </p>

          <h3 className="mb-3 text-xl font-semibold">Inputs</h3>

          <ul className="mb-6 list-disc space-y-2 pl-6 text-slate-700">
            <li>
              <strong>Heavy-chain sequence:</strong> full antibody heavy-chain
              variable-region sequence.
            </li>
            <li>
              <strong>Antigen sequence:</strong> amino-acid sequence of the
              target antigen.
            </li>
          </ul>

          <h3 className="mb-3 text-xl font-semibold">Outputs</h3>

          <ul className="mb-6 list-disc space-y-2 pl-6 text-slate-700">
            <li>
              <strong>Binding probability:</strong> value between 0 and 1.
            </li>
            <li>
              <strong>Binding logit:</strong> raw model score before sigmoid
              transformation.
            </li>
          </ul>

          <div className="mb-10 rounded-xl bg-slate-100 p-5 text-sm leading-7 text-slate-700">
            <strong>Suggested interpretation:</strong>
            <br />
            Binding probability ≥ 0.80: high-priority computational candidate.
            <br />
            Binding probability 0.50–0.80: intermediate candidate requiring
            additional filtering.
            <br />
            Binding probability &lt; 0.50: lower-priority candidate.
          </div>

          <h2 className="mb-4 text-2xl font-bold">6. Developability Module</h2>

          <p className="mb-4 leading-7 text-slate-700">
            The Developability module evaluates sequence-derived properties
            associated with antibody manufacturability and therapeutic
            tractability. It compares candidate sequences with an antigen-matched
            reference cohort whenever available.
          </p>

          <h3 className="mb-3 text-xl font-semibold">Features Evaluated</h3>

          <ul className="mb-6 list-disc space-y-2 pl-6 text-slate-700">
            <li>CDRH3 length</li>
            <li>Hydrophobicity and hydrophobic runs</li>
            <li>Net charge at pH 7.4</li>
            <li>Aromatic, positive, negative, and hydrophobic residue fractions</li>
            <li>N-linked glycosylation motifs</li>
            <li>Deamidation-prone motifs</li>
            <li>Asp isomerization-prone motifs</li>
            <li>Methionine oxidation hotspots</li>
            <li>Extra cysteine residues</li>
            <li>Nearest-neighbor distance to same-antigen antibody sequences</li>
          </ul>

          <h3 className="mb-3 text-xl font-semibold">Outputs</h3>

          <ul className="mb-6 list-disc space-y-2 pl-6 text-slate-700">
            <li>
              <strong>Hard filter pass:</strong> whether the sequence passes
              predefined developability filters.
            </li>
            <li>
              <strong>Hard filter reasons:</strong> liabilities detected when a
              candidate fails the filter.
            </li>
            <li>
              <strong>Developability risk score:</strong> lower values indicate
              lower predicted sequence liability.
            </li>
            <li>
              <strong>Risk percentile:</strong> candidate risk relative to the
              same-antigen reference cohort.
            </li>
            <li>
              <strong>Heavy-chain nearest-neighbor distance:</strong> sequence
              distance to the closest same-antigen heavy chain.
            </li>
            <li>
              <strong>CDRH3 nearest-neighbor distance:</strong> sequence distance
              to the closest same-antigen CDRH3.
            </li>
          </ul>

          <div className="mb-10 rounded-xl bg-slate-100 p-5 text-sm leading-7 text-slate-700">
            <strong>Recommended candidate profile:</strong>
            <br />
            hard filter pass = true
            <br />
            low developability risk score
            <br />
            risk percentile below 50%
            <br />
            high binding probability
            <br />
            non-trivial nearest-neighbor distance from known same-antigen
            antibodies
          </div>

          <h2 className="mb-4 text-2xl font-bold">7. Full Pipeline Module</h2>

          <p className="mb-4 leading-7 text-slate-700">
            The Full Pipeline module runs generation, CDRH3 grafting, binding
            prediction, developability assessment, and candidate ranking in one
            workflow.
          </p>

          <h3 className="mb-3 text-xl font-semibold">Required Inputs</h3>

          <ul className="mb-6 list-disc space-y-2 pl-6 text-slate-700">
            <li>Antigen name</li>
            <li>Antigen amino-acid sequence</li>
            <li>Template heavy-chain sequence</li>
            <li>Template CDRH3 sequence</li>
            <li>Number of CDRH3 candidates to generate</li>
          </ul>

          <div className="mb-10 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm leading-7 text-blue-900">
            The template CDRH3 sequence must be present inside the template
            heavy-chain sequence. SPACE replaces the template CDRH3 with each
            generated CDRH3 before binding prediction and developability
            assessment.
          </div>

          <h2 className="mb-4 text-2xl font-bold">8. LLM Controller Module</h2>

          <p className="mb-4 leading-7 text-slate-700">
            The LLM Controller module performs closed-loop antibody design. It repeatedly
            generates candidates, predicts binding, evaluates developability,
            and selects candidates that satisfy user-defined constraints.
          </p>

          <ol className="mb-6 list-decimal space-y-2 pl-6 text-slate-700">
            <li>Parse the design request and target antigen.</li>
            <li>Generate a batch of CDRH3 sequences.</li>
            <li>Graft generated CDRH3 sequences into the selected scaffold.</li>
            <li>Predict antibody-antigen binding probability.</li>
            <li>Evaluate developability risk and hard-filter status.</li>
            <li>Rank candidates using a composite score.</li>
            <li>Adapt sampling parameters for the next round if needed.</li>
            <li>Return accepted candidates and full search history.</li>
          </ol>

          <h3 className="mb-3 text-xl font-semibold">Typical LLM Controller Request</h3>

          <div className="mb-10 rounded-xl bg-slate-100 p-5 font-mono text-sm leading-7">
            Find 10 antibody candidates for SARS-CoV-2 Omicron BA.2 with high
            predicted binding probability, low developability risk, and diverse
            CDRH3 sequences.
          </div>

          <h2 className="mb-4 text-2xl font-bold">9. Downloadable Outputs</h2>

          <ul className="mb-10 list-disc space-y-2 pl-6 text-slate-700">
            <li>
              <strong>generated_candidates.csv:</strong> generated CDRH3
              candidates.
            </li>
            <li>
              <strong>binding_predictions.csv:</strong> binding logits and
              probabilities.
            </li>
            <li>
              <strong>developability_results.csv:</strong> developability scores,
              risk percentiles, hard-filter status, and novelty metrics.
            </li>
            <li>
              <strong>full_pipeline_results.csv:</strong> ranked candidates from
              the complete pipeline.
            </li>
            <li>
              <strong>LLM Controller_accepted_candidates.csv:</strong> candidates accepted
              by the LLM Controller.
            </li>
            <li>
              <strong>LLM Controller_search_history.csv:</strong> all candidates evaluated
              during LLM Controller search.
            </li>
          </ul>

          <h2 className="mb-4 text-2xl font-bold">10. Practical Tips</h2>

          <ul className="mb-10 list-disc space-y-2 pl-6 text-slate-700">
            <li>
              Use stochastic sampling and moderate temperature for diverse
              candidate generation.
            </li>
            <li>
              Increase the number of generated samples when few candidates pass
              the hard filter.
            </li>
            <li>
              Prioritize candidates that jointly satisfy binding and
              developability constraints.
            </li>
            <li>
              Do not select candidates based only on binding probability.
              Developability risk and sequence novelty should also be considered.
            </li>
            <li>
              Always perform experimental validation before biological
              interpretation.
            </li>
          </ul>

          <h2 className="mb-4 text-2xl font-bold">11. Contact</h2>

          <p className="leading-7 text-slate-700">
            For questions about SPACE, model usage, or interpretation of output
            files, please contact the project maintainer or open an issue in the
            associated GitHub repository.
          </p>
        </div>
      </section>
    </main>
  );
}
