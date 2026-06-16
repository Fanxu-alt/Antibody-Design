"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import SectionTitle from "../components/SectionTitle";
import {
  API_BASE,
  DEFAULT_ANTIGEN,
  DEFAULT_CDRH3,
  DEFAULT_HEAVY,
  formatNumber,
} from "../components/config";

type GeneratedCandidate = {
  antigen?: string;
  target_name?: string;
  cdrh3: string;
  pred_len?: number;
  sample_mode?: string;
  temperature?: number;
};

type BindingResult = {
  binding_probability?: number;
  logit?: number;
  [key: string]: unknown;
};

type PredictionMode = "generated" | "manual";

type PredictionRow = {
  rank: number;
  target_name: string;
  cdrh3: string;
  heavy_chain: string;
  antigen: string;
  binding_probability?: number;
  binding_logit?: number;
};

function cleanSequence(seq: string) {
  return String(seq || "").trim().toUpperCase().replace(/\s+/g, "");
}

function graftCdrh3IntoHeavy(
  templateHeavy: string,
  templateCdrh3: string,
  newCdrh3: string
) {
  const heavy = cleanSequence(templateHeavy);
  const oldCdrh3 = cleanSequence(templateCdrh3);
  const cdrh3 = cleanSequence(newCdrh3);

  if (!heavy || !oldCdrh3 || !cdrh3) {
    return "";
  }

  if (!heavy.includes(oldCdrh3)) {
    return "";
  }

  return heavy.replace(oldCdrh3, cdrh3);
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header] ?? "";
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function sortTargets(targets: string[]) {
  return [...new Set(targets)]
    .map((target) => String(target))
    .sort((a, b) => {
      const aIsSars = a.toLowerCase().includes("sars");
      const bIsSars = b.toLowerCase().includes("sars");

      if (aIsSars && !bIsSars) return -1;
      if (!aIsSars && bIsSars) return 1;

      return a.localeCompare(b);
    });
}

export default function PredictPage() {
  const [mode, setMode] = useState<PredictionMode>("generated");

  const [targets, setTargets] = useState<string[]>([]);
  const [targetName, setTargetName] = useState("");
  const [targetsLoading, setTargetsLoading] = useState(false);

  const [generatedCandidates, setGeneratedCandidates] = useState<
    GeneratedCandidate[]
  >([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const [templateHeavy, setTemplateHeavy] = useState(DEFAULT_HEAVY);
  const [templateCdrh3, setTemplateCdrh3] = useState(DEFAULT_CDRH3);
  const [antigen, setAntigen] = useState(DEFAULT_ANTIGEN);

  const [manualHeavy, setManualHeavy] = useState(DEFAULT_HEAVY);
  const [manualAntigen, setManualAntigen] = useState(DEFAULT_ANTIGEN);

  const [singleResult, setSingleResult] = useState<BindingResult | null>(null);
  const [predictionRows, setPredictionRows] = useState<PredictionRow[]>([]);
  const [summary, setSummary] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allSelected =
    generatedCandidates.length > 0 &&
    selectedIndices.length === generatedCandidates.length;

  const selectedCandidates = useMemo(() => {
    return selectedIndices
      .map((index) => ({
        index,
        candidate: generatedCandidates[index],
      }))
      .filter((item) => item.candidate);
  }, [generatedCandidates, selectedIndices]);

  useEffect(() => {
    async function loadTargets() {
      setTargetsLoading(true);

      try {
        const response = await fetch(`${API_BASE}/targets`);

        if (!response.ok) {
          throw new Error(`Failed to load targets: ${response.status}`);
        }

        const data = await response.json();
        const loadedTargets = sortTargets(data.targets || []);
        setTargets(loadedTargets);

        const savedTarget = localStorage.getItem("space_target_name");

        if (savedTarget && loadedTargets.includes(savedTarget)) {
          setTargetName(savedTarget);
        } else if (loadedTargets.includes("SARS-CoV2_Beta")) {
          setTargetName("SARS-CoV2_Beta");
        } else if (loadedTargets.length > 0) {
          setTargetName(loadedTargets[0]);
        }
      } catch {
        const fallbackTargets = [
          "SARS-CoV2_Beta",
          "hiv_gp120",
          "hiv_gp160",
          "influenza_ha",
          "neuraminidase",
          "circumsporozoite",
        ];

        setTargets(fallbackTargets);
        setTargetName(
          localStorage.getItem("space_target_name") || "SARS-CoV2_Beta"
        );
      } finally {
        setTargetsLoading(false);
      }
    }

    const savedCandidates = localStorage.getItem("space_generated_candidates");
    const savedAntigen = localStorage.getItem("space_antigen");

    if (savedCandidates) {
      try {
        const parsed = JSON.parse(savedCandidates);
        if (Array.isArray(parsed)) {
          setGeneratedCandidates(parsed);
          setSelectedIndices(parsed.map((_, index) => index));

          const firstCandidate = parsed[0];
          if (firstCandidate?.antigen) {
            setAntigen(firstCandidate.antigen);
            setManualAntigen(firstCandidate.antigen);
          }
          if (firstCandidate?.target_name) {
            setTargetName(firstCandidate.target_name);
          }
        }
      } catch {
        // Ignore malformed localStorage content.
      }
    }

    if (savedAntigen) {
      setAntigen(savedAntigen);
      setManualAntigen(savedAntigen);
    }

    loadTargets();
  }, []);

  function setAndSaveTarget(nextTarget: string) {
    setTargetName(nextTarget);
    localStorage.setItem("space_target_name", nextTarget);
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(generatedCandidates.map((_, index) => index));
    }
  }

  function toggleCandidate(index: number) {
    setSelectedIndices((previous) => {
      if (previous.includes(index)) {
        return previous.filter((item) => item !== index);
      }

      return [...previous, index].sort((a, b) => a - b);
    });
  }

  function loadExample() {
    const exampleTarget = targets.includes("SARS-CoV2_Beta")
      ? "SARS-CoV2_Beta"
      : targets.length > 0
      ? targets[0]
      : "";

    setMode("generated");
    setAndSaveTarget(exampleTarget);
    setTemplateHeavy(DEFAULT_HEAVY);
    setTemplateCdrh3(DEFAULT_CDRH3);
    setAntigen(DEFAULT_ANTIGEN);
    setManualHeavy(DEFAULT_HEAVY);
    setManualAntigen(DEFAULT_ANTIGEN);
    setSingleResult(null);
    setPredictionRows([]);
    setSummary("");
    setError("");

    localStorage.setItem("space_antigen", DEFAULT_ANTIGEN);
  }

  function downloadPredictionResults() {
    const rows = predictionRows.map((row, index) => ({
      rank: index + 1,
      original_rank: row.rank,
      target_name: row.target_name,
      cdrh3: row.cdrh3,
      binding_probability: row.binding_probability ?? "",
      binding_logit: row.binding_logit ?? "",
      heavy_chain: row.heavy_chain,
      antigen: row.antigen,
      prediction_mode: mode,
    }));

    downloadCsv("binding_prediction_results.csv", rows);
  }

  async function callPredictBinding(heavySeq: string, antigenSeq: string) {
    const response = await fetch(`${API_BASE}/predict-binding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        heavy_seq: heavySeq,
        antigen_seq: antigenSeq,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error: ${response.status} ${text}`);
    }

    return response.json();
  }

  function savePredictionRows(rows: PredictionRow[]) {
    setPredictionRows(rows);
    localStorage.setItem("space_prediction_results", JSON.stringify(rows));
    localStorage.setItem("space_antigen", mode === "manual" ? manualAntigen : antigen);
    localStorage.setItem("space_target_name", targetName);
  }

  async function predictSelected() {
    setLoading(true);
    setError("");
    setSingleResult(null);
    setPredictionRows([]);
    setSummary("");

    try {
      if (!targetName) {
        throw new Error("Please select a target name.");
      }

      if (mode === "manual") {
        const heavySeq = cleanSequence(manualHeavy);
        const antigenSeq = cleanSequence(manualAntigen);

        if (!heavySeq) throw new Error("Please provide a heavy-chain sequence.");
        if (!antigenSeq) throw new Error("Please provide an antigen sequence.");

        const result = await callPredictBinding(heavySeq, antigenSeq);

        const rows: PredictionRow[] = [
          {
            rank: 1,
            target_name: targetName,
            cdrh3: "Manual full heavy-chain sequence",
            heavy_chain: heavySeq,
            antigen: antigenSeq,
            binding_probability: result.binding_probability,
            binding_logit: result.logit,
          },
        ];

        setSingleResult(result);
        savePredictionRows(rows);
        setSummary(
          [
            "Prediction mode: Manual Sequence",
            `Target: ${targetName}`,
            "Predicted sequences: 1",
            `Heavy-chain length: ${heavySeq.length}`,
            `Antigen length: ${antigenSeq.length}`,
          ].join("\n")
        );

        return;
      }

      if (selectedCandidates.length === 0) {
        throw new Error(
          "Please select at least one generated CDRH3 candidate, or use Predict All."
        );
      }

      const antigenSeq = cleanSequence(antigen);
      if (!antigenSeq) throw new Error("Please provide an antigen sequence.");

      const rows: PredictionRow[] = [];

      for (const item of selectedCandidates) {
        const cdrh3 = item.candidate.cdrh3;
        const heavySeq = graftCdrh3IntoHeavy(templateHeavy, templateCdrh3, cdrh3);

        if (!heavySeq) {
          throw new Error(
            `Could not graft CDRH3 ${cdrh3}. Please check that Template CDRH3 exists inside the Heavy-chain Template.`
          );
        }

        const result = await callPredictBinding(heavySeq, antigenSeq);

        rows.push({
          rank: item.index + 1,
          target_name: item.candidate.target_name || targetName,
          cdrh3,
          heavy_chain: heavySeq,
          antigen: antigenSeq,
          binding_probability: result.binding_probability,
          binding_logit: result.logit,
        });
      }

      rows.sort((a, b) => {
        const left = a.binding_probability ?? -Infinity;
        const right = b.binding_probability ?? -Infinity;
        return right - left;
      });

      savePredictionRows(rows);
      setSummary(
        [
          "Prediction mode: Generated Candidates",
          `Target: ${targetName}`,
          `Predicted sequences: ${rows.length}`,
          `Selected candidates: ${selectedIndices.length}`,
          `Antigen length: ${antigenSeq.length}`,
        ].join("\n")
      );
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function predictAll() {
    setSelectedIndices(generatedCandidates.map((_, index) => index));

    setLoading(true);
    setError("");
    setSingleResult(null);
    setPredictionRows([]);
    setSummary("");

    try {
      if (!targetName) {
        throw new Error("Please select a target name.");
      }

      if (generatedCandidates.length === 0) {
        throw new Error(
          "No generated CDRH3 candidates found. Please run the Generate page first."
        );
      }

      const antigenSeq = cleanSequence(antigen);
      if (!antigenSeq) throw new Error("Please provide an antigen sequence.");

      const rows: PredictionRow[] = [];

      for (let index = 0; index < generatedCandidates.length; index++) {
        const candidate = generatedCandidates[index];
        const cdrh3 = candidate.cdrh3;

        const heavySeq = graftCdrh3IntoHeavy(templateHeavy, templateCdrh3, cdrh3);

        if (!heavySeq) {
          throw new Error(
            `Could not graft CDRH3 ${cdrh3}. Please check that Template CDRH3 exists inside the Heavy-chain Template.`
          );
        }

        const result = await callPredictBinding(heavySeq, antigenSeq);

        rows.push({
          rank: index + 1,
          target_name: candidate.target_name || targetName,
          cdrh3,
          heavy_chain: heavySeq,
          antigen: antigenSeq,
          binding_probability: result.binding_probability,
          binding_logit: result.logit,
        });
      }

      rows.sort((a, b) => {
        const left = a.binding_probability ?? -Infinity;
        const right = b.binding_probability ?? -Infinity;
        return right - left;
      });

      savePredictionRows(rows);
      setSummary(
        [
          "Prediction mode: Generated Candidates",
          `Target: ${targetName}`,
          `Predicted sequences: ${rows.length}`,
          "Selection: all generated candidates",
          `Antigen length: ${antigenSeq.length}`,
        ].join("\n")
      );
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <section className="mx-auto max-w-7xl px-8 py-12">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <SectionTitle
            label="Module 02"
            title="Predict Binding"
            description="Predict antibody-antigen interaction for selected generated CDRH3 candidates or for a manually entered heavy-chain sequence."
          />

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Target name
              </label>
              <select
                value={targetName}
                onChange={(event) => setAndSaveTarget(event.target.value)}
                disabled={targetsLoading || targets.length === 0}
                className="w-full rounded-xl border p-3 disabled:bg-slate-100"
              >
                {targetsLoading && <option>Loading targets...</option>}

                {!targetsLoading && targets.length === 0 && (
                  <option>No targets loaded</option>
                )}

                {!targetsLoading &&
                  targets.map((target) => (
                    <option key={target} value={target}>
                      {target}
                    </option>
                  ))}
              </select>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-bold">Mode</h3>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-3 text-sm font-semibold">
                  <input
                    type="radio"
                    name="prediction-mode"
                    value="generated"
                    checked={mode === "generated"}
                    onChange={() => setMode("generated")}
                    className="h-4 w-4"
                  />
                  Generated Candidates
                </label>

                <label className="flex items-center gap-3 text-sm font-semibold">
                  <input
                    type="radio"
                    name="prediction-mode"
                    value="manual"
                    checked={mode === "manual"}
                    onChange={() => setMode("manual")}
                    className="h-4 w-4"
                  />
                  Manual Sequence
                </label>
              </div>
            </div>
          </div>

          {mode === "generated" && (
            <div className="grid gap-8 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <div className="rounded-2xl border">
                  <div className="flex items-center justify-between border-b bg-slate-100 px-4 py-3">
                    <h3 className="text-xl font-bold">Generated Candidates</h3>

                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        disabled={generatedCandidates.length === 0}
                      />
                      Select all
                    </label>
                  </div>

                  {generatedCandidates.length > 0 ? (
                    <div className="max-h-[420px] overflow-auto">
                      <table className="w-full border-collapse bg-white text-sm">
                        <thead className="bg-slate-50 text-left">
                          <tr>
                            <th className="border-b p-3">Select</th>
                            <th className="border-b p-3">Rank</th>
                            <th className="border-b p-3">CDRH3</th>
                            <th className="border-b p-3">Length</th>
                          </tr>
                        </thead>

                        <tbody>
                          {generatedCandidates.map((row, index) => (
                            <tr
                              key={`${row.cdrh3}-${index}`}
                              className="hover:bg-slate-50"
                            >
                              <td className="border-b p-3">
                                <input
                                  type="checkbox"
                                  checked={selectedIndices.includes(index)}
                                  onChange={() => toggleCandidate(index)}
                                />
                              </td>
                              <td className="border-b p-3">{index + 1}</td>
                              <td className="border-b p-3 font-mono font-semibold text-blue-700">
                                {row.cdrh3}
                              </td>
                              <td className="border-b p-3">
                                {row.pred_len ?? row.cdrh3.length}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-sm leading-6 text-slate-500">
                      No generated candidates found. Go to the Generate page,
                      run Generate CDRH3, then return here. You can also use
                      Manual Sequence mode.
                    </div>
                  )}
                </div>

                <button
                  onClick={loadExample}
                  className="mt-4 rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Load example
                </button>
              </div>

              <div className="lg:col-span-3">
                <label className="mb-2 block text-sm font-semibold">
                  Heavy-chain Template
                </label>
                <textarea
                  className="h-36 w-full rounded-xl border p-4 font-mono text-sm"
                  value={templateHeavy}
                  onChange={(event) => setTemplateHeavy(event.target.value)}
                />

                <label className="mb-2 mt-4 block text-sm font-semibold">
                  Template CDRH3
                </label>
                <input
                  className="w-full rounded-xl border p-3 font-mono text-sm"
                  value={templateCdrh3}
                  onChange={(event) => setTemplateCdrh3(event.target.value)}
                />

                <label className="mb-2 mt-4 block text-sm font-semibold">
                  Antigen Sequence
                </label>
                <textarea
                  className="h-36 w-full rounded-xl border p-4 font-mono text-sm"
                  value={antigen}
                  onChange={(event) => setAntigen(event.target.value)}
                />
              </div>
            </div>
          )}

          {mode === "manual" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Heavy-chain Sequence
                </label>
                <textarea
                  className="h-52 w-full rounded-xl border p-4 font-mono text-sm"
                  value={manualHeavy}
                  onChange={(event) => setManualHeavy(event.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Antigen Sequence
                </label>
                <textarea
                  className="h-52 w-full rounded-xl border p-4 font-mono text-sm"
                  value={manualAntigen}
                  onChange={(event) => setManualAntigen(event.target.value)}
                />
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3 border-t pt-6">
            <button
              onClick={predictSelected}
              disabled={loading || !targetName}
              className="rounded-full bg-blue-700 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? "Predicting..." : "Predict Selected"}
            </button>

            {mode === "generated" && (
              <button
                onClick={predictAll}
                disabled={loading || generatedCandidates.length === 0 || !targetName}
                className="rounded-full bg-slate-900 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {loading ? "Predicting..." : "Predict All"}
              </button>
            )}

            <button
              onClick={downloadPredictionResults}
              disabled={predictionRows.length === 0}
              className="rounded-full border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              Download CSV
            </button>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {(summary || predictionRows.length > 0 || singleResult) && (
            <div className="mt-8">
              <div className="mb-6 rounded-2xl border bg-slate-50 p-6">
                <h3 className="mb-3 text-xl font-bold">Run summary</h3>
                {summary ? (
                  <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {summary}
                  </pre>
                ) : (
                  <p className="text-sm text-slate-500">
                    Prediction summary will appear here.
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border bg-white p-6">
                  <p className="text-sm text-slate-600">Binding Probability</p>
                  <p className="mt-2 text-4xl font-bold text-blue-700">
                    {formatNumber(
                      predictionRows[0]?.binding_probability ??
                        singleResult?.binding_probability
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border bg-white p-6">
                  <p className="text-sm text-slate-600">Binding Logit</p>
                  <p className="mt-2 text-4xl font-bold text-blue-700">
                    {formatNumber(
                      predictionRows[0]?.binding_logit ?? singleResult?.logit
                    )}
                  </p>
                </div>
              </div>

              {predictionRows.length > 0 && (
                <div className="mt-8 rounded-2xl border">
                  <div className="flex items-center justify-between border-b bg-slate-100 px-4 py-3">
                    <h3 className="text-xl font-bold">Prediction Results</h3>
                    <button
                      onClick={downloadPredictionResults}
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Download CSV
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse bg-white text-sm">
                      <thead className="bg-slate-50 text-left">
                        <tr>
                          <th className="border-b p-3">Rank</th>
                          <th className="border-b p-3">Target</th>
                          <th className="border-b p-3">CDRH3</th>
                          <th className="border-b p-3">
                            Binding Probability
                          </th>
                          <th className="border-b p-3">Binding Logit</th>
                        </tr>
                      </thead>

                      <tbody>
                        {predictionRows.map((row, index) => (
                          <tr
                            key={`${row.cdrh3}-${index}`}
                            className="hover:bg-slate-50"
                          >
                            <td className="border-b p-3">{index + 1}</td>
                            <td className="border-b p-3">{row.target_name}</td>
                            <td className="border-b p-3 font-mono font-semibold text-blue-700">
                              {row.cdrh3}
                            </td>
                            <td className="border-b p-3">
                              {formatNumber(row.binding_probability)}
                            </td>
                            <td className="border-b p-3">
                              {formatNumber(row.binding_logit)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
