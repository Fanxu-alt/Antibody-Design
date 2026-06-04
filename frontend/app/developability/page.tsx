"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import SectionTitle from "../components/SectionTitle";
import {
  API_BASE,
  DEFAULT_CDRH3,
  DEFAULT_HEAVY,
  formatNumber,
} from "../components/config";

type Mode = "predicted" | "manual";

type PredictionRow = {
  rank?: number;
  cdrh3: string;
  heavy_chain: string;
  binding_probability?: number;
  binding_logit?: number;
};

type ManualCandidate = {
  cdrh3: string;
  heavy_chain: string;
};

type DevelopabilityResult = {
  rank?: number;
  candidate_name: string;
  cdrh3: string;
  heavy_chain?: string;
  binding_probability?: number;
  binding_logit?: number;
  developability_risk_score?: number;
  developability_risk_score_percentile?: number;
  hard_filter_pass?: boolean;
  hard_filter_reasons?: string;
  low_risk_claim?: string;
  high_diversity_claim?: string;
  overall_claim?: string;
};

function cleanSequence(seq: string) {
  return String(seq || "").trim().toUpperCase().replace(/\s+/g, "");
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

export default function DevelopabilityPage() {
  const [mode, setMode] = useState<Mode>("predicted");

  const [targets, setTargets] = useState<string[]>([]);
  const [targetName, setTargetName] = useState("");

  const [predictionRows, setPredictionRows] = useState<PredictionRow[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const [manualCandidates, setManualCandidates] = useState<ManualCandidate[]>([
    {
      cdrh3: DEFAULT_CDRH3,
      heavy_chain: DEFAULT_HEAVY,
    },
  ]);

  const [results, setResults] = useState<DevelopabilityResult[]>([]);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allSelected =
    predictionRows.length > 0 && selectedIndices.length === predictionRows.length;

  useEffect(() => {
    async function loadTargets() {
      try {
        const response = await fetch(`${API_BASE}/targets`);
        const data = await response.json();
        const loadedTargets = data.targets || [];

        if (Array.isArray(loadedTargets) && loadedTargets.length > 0) {
          const sortedTargets = [...loadedTargets].sort();
          setTargets(sortedTargets);

          if (sortedTargets.includes("SARS-CoV2_Beta")) {
            setTargetName("SARS-CoV2_Beta");
          } else if (sortedTargets.includes("hiv_gp120")) {
            setTargetName("hiv_gp120");
          } else {
            setTargetName(sortedTargets[0]);
          }
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
        setTargetName("SARS-CoV2_Beta");
      }
    }

    const savedPredictionResults = localStorage.getItem(
      "space_prediction_results"
    );

    if (savedPredictionResults) {
      try {
        const parsed = JSON.parse(savedPredictionResults);
        if (Array.isArray(parsed)) {
          setPredictionRows(parsed);
          setSelectedIndices(parsed.map((_, index) => index));
        }
      } catch {
        // Ignore malformed localStorage.
      }
    }

    loadTargets();
  }, []);

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(predictionRows.map((_, index) => index));
    }
  }

  function togglePredictionRow(index: number) {
    setSelectedIndices((previous) => {
      if (previous.includes(index)) {
        return previous.filter((item) => item !== index);
      }

      return [...previous, index].sort((a, b) => a - b);
    });
  }

  function addManualCandidate() {
    setManualCandidates([
      ...manualCandidates,
      {
        cdrh3: "",
        heavy_chain: "",
      },
    ]);
  }

  function updateManualCandidate(
    index: number,
    field: keyof ManualCandidate,
    value: string
  ) {
    setManualCandidates((previous) =>
      previous.map((candidate, i) =>
        i === index ? { ...candidate, [field]: value } : candidate
      )
    );
  }

  function removeManualCandidate(index: number) {
    setManualCandidates((previous) => previous.filter((_, i) => i !== index));
  }

  function buildCandidatesForRequest() {
    if (mode === "predicted") {
      if (selectedIndices.length === 0) {
        throw new Error("Please select at least one previous binding prediction.");
      }

      return selectedIndices.map((index) => {
        const row = predictionRows[index];

        return {
          candidate_name: `${targetName}_C${index + 1}`,
          cdrh3: cleanSequence(row.cdrh3),
          heavy_chain: cleanSequence(row.heavy_chain),
          binding_probability:
            typeof row.binding_probability === "number"
              ? row.binding_probability
              : null,
          binding_logit:
            typeof row.binding_logit === "number" ? row.binding_logit : null,
        };
      });
    }

    const candidates = manualCandidates.map((candidate, index) => ({
      candidate_name: `${targetName}_C${index + 1}`,
      cdrh3: cleanSequence(candidate.cdrh3),
      heavy_chain: cleanSequence(candidate.heavy_chain),
      binding_probability: null,
      binding_logit: null,
    }));

    const validCandidates = candidates.filter(
      (candidate) => candidate.cdrh3 && candidate.heavy_chain
    );

    if (validCandidates.length === 0) {
      throw new Error("Please provide at least one manual candidate.");
    }

    return validCandidates;
  }

  async function runDevelopability() {
    setLoading(true);
    setError("");
    setResults([]);
    setDownloadUrl("");
    setSummary("");

    try {
      if (!targetName) {
        throw new Error("Please select a target name.");
      }

      const candidates = buildCandidatesForRequest();

      const response = await fetch(`${API_BASE}/score-developability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target_name: targetName,
          candidates,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error: ${response.status} ${text}`);
      }

      const data = await response.json();

      setResults(data.results || []);
      setDownloadUrl(data.download_url || "");

      localStorage.setItem(
        "space_developability_results",
        JSON.stringify(data.results || [])
      );

      if (data.download_url) {
        localStorage.setItem("space_latest_download_url", data.download_url);
      }

      setSummary(
        [
          `Target name: ${data.target_name || targetName}`,
          `Candidates scored: ${data.count ?? candidates.length}`,
          `Input mode: ${
            mode === "predicted"
              ? "previous binding prediction results"
              : "manual candidates"
          }`,
          "Ranking strategy: hard-filter pass first, then higher binding probability if available, then lower developability risk.",
        ].join("\n")
      );
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  function downloadDevelopabilityResults() {
    const rows = results.map((row) => ({
      rank: row.rank ?? "",
      candidate_name: row.candidate_name,
      target_name: targetName,
      cdrh3: row.cdrh3,
      binding_probability: row.binding_probability ?? "",
      binding_logit: row.binding_logit ?? "",
      developability_risk_score: row.developability_risk_score ?? "",
      developability_risk_score_percentile:
        row.developability_risk_score_percentile ?? "",
      hard_filter_pass:
        typeof row.hard_filter_pass === "boolean"
          ? String(row.hard_filter_pass)
          : "",
      hard_filter_reasons: row.hard_filter_reasons ?? "",
      low_risk_claim: row.low_risk_claim ?? "",
      high_diversity_claim: row.high_diversity_claim ?? "",
      overall_claim: row.overall_claim ?? "",
      heavy_chain: row.heavy_chain ?? "",
    }));

    downloadCsv("developability_results.csv", rows);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <section className="mx-auto max-w-7xl px-8 py-12">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <SectionTitle
            label="Module 03"
            title="Developability"
            description="Score candidate antibodies using target-specific developability cohorts. You can use previous binding prediction results or enter candidates manually."
          />

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Target name
              </label>
              <select
                value={targetName}
                onChange={(event) => setTargetName(event.target.value)}
                className="w-full rounded-xl border p-3"
              >
                {targets.map((target) => (
                  <option key={target} value={target}>
                    {target}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                This list is loaded from the backend and includes SARS-CoV-2
                variants plus the added antigen groups.
              </p>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-sm font-semibold">Input mode</p>
              <div className="mt-3 flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="radio"
                    name="developability-mode"
                    checked={mode === "predicted"}
                    onChange={() => setMode("predicted")}
                  />
                  Previous binding predictions
                </label>

                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="radio"
                    name="developability-mode"
                    checked={mode === "manual"}
                    onChange={() => setMode("manual")}
                  />
                  Manual candidates
                </label>
              </div>
            </div>
          </div>

          {mode === "predicted" && (
            <div className="rounded-2xl border">
              <div className="flex items-center justify-between border-b bg-slate-100 px-4 py-3">
                <h3 className="text-xl font-bold">
                  Previous Binding Prediction Results
                </h3>

                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    disabled={predictionRows.length === 0}
                  />
                  Select all
                </label>
              </div>

              {predictionRows.length > 0 ? (
                <div className="max-h-[480px] overflow-auto">
                  <table className="w-full border-collapse bg-white text-sm">
                    <thead className="bg-slate-50 text-left">
                      <tr>
                        <th className="border-b p-3">Select</th>
                        <th className="border-b p-3">Rank</th>
                        <th className="border-b p-3">CDRH3</th>
                        <th className="border-b p-3">Binding probability</th>
                        <th className="border-b p-3">Binding logit</th>
                      </tr>
                    </thead>

                    <tbody>
                      {predictionRows.map((row, index) => (
                        <tr
                          key={`${row.cdrh3}-${index}`}
                          className="hover:bg-slate-50"
                        >
                          <td className="border-b p-3">
                            <input
                              type="checkbox"
                              checked={selectedIndices.includes(index)}
                              onChange={() => togglePredictionRow(index)}
                            />
                          </td>
                          <td className="border-b p-3">{index + 1}</td>
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
              ) : (
                <div className="p-6 text-sm leading-6 text-slate-500">
                  No previous binding prediction results found. Go to Predict,
                  run Predict Selected or Predict All, then return here. You can
                  also switch to Manual candidates mode.
                </div>
              )}
            </div>
          )}

          {mode === "manual" && (
            <div className="rounded-2xl border">
              <div className="flex items-center justify-between border-b bg-slate-100 px-4 py-3">
                <h3 className="text-xl font-bold">Manual Candidates</h3>
                <button
                  onClick={addManualCandidate}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Add candidate
                </button>
              </div>

              <div className="space-y-6 p-4">
                {manualCandidates.map((candidate, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border bg-slate-50 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="font-bold">
                        {targetName ? `${targetName}_C${index + 1}` : `Candidate ${index + 1}`}
                      </h4>
                      {manualCandidates.length > 1 && (
                        <button
                          onClick={() => removeManualCandidate(index)}
                          className="text-sm font-semibold text-red-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="mb-4 rounded-xl border bg-white p-3 text-sm text-slate-600">
                      Target name / candidate ID:{" "}
                      <span className="font-mono font-semibold text-blue-700">
                        {targetName ? `${targetName}_C${index + 1}` : "Select target first"}
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold">
                          CDRH3
                        </label>
                        <input
                          className="w-full rounded-xl border p-3 font-mono text-sm"
                          value={candidate.cdrh3}
                          onChange={(event) =>
                            updateManualCandidate(
                              index,
                              "cdrh3",
                              event.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-semibold">
                        Heavy-chain sequence
                      </label>
                      <textarea
                        className="h-32 w-full rounded-xl border p-4 font-mono text-sm"
                        value={candidate.heavy_chain}
                        onChange={(event) =>
                          updateManualCandidate(
                            index,
                            "heavy_chain",
                            event.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3 border-t pt-6">
            <button
              onClick={runDevelopability}
              disabled={loading || !targetName}
              className="rounded-full bg-blue-700 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? "Scoring..." : "Run Developability Scoring"}
            </button>

            <button
              onClick={downloadDevelopabilityResults}
              disabled={results.length === 0}
              className="rounded-full border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              Download CSV
            </button>

            {downloadUrl && (
              <a
                href={downloadUrl}
                download
                className="rounded-full bg-slate-900 px-6 py-3 font-semibold text-white"
              >
                Download server CSV
              </a>
            )}
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {summary && (
            <div className="mt-8 rounded-2xl border bg-slate-50 p-6">
              <h3 className="mb-3 text-xl font-bold">Run summary</h3>
              <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {summary}
              </pre>
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-8 rounded-2xl border">
              <div className="flex items-center justify-between border-b bg-slate-100 px-4 py-3">
                <h3 className="text-xl font-bold">
                  Developability Results
                </h3>

                <button
                  onClick={downloadDevelopabilityResults}
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
                      <th className="border-b p-3">Candidate</th>
                      <th className="border-b p-3">CDRH3</th>
                      <th className="border-b p-3">Binding probability</th>
                      <th className="border-b p-3">Developability risk</th>
                      <th className="border-b p-3">Risk percentile</th>
                      <th className="border-b p-3">Pass filter</th>
                      <th className="border-b p-3">Reasons</th>
                    </tr>
                  </thead>

                  <tbody>
                    {results.map((row, index) => (
                      <tr
                        key={`${row.candidate_name}-${index}`}
                        className="hover:bg-slate-50"
                      >
                        <td className="border-b p-3">
                          {row.rank ?? index + 1}
                        </td>
                        <td className="border-b p-3">{row.candidate_name}</td>
                        <td className="border-b p-3 font-mono font-semibold text-blue-700">
                          {row.cdrh3}
                        </td>
                        <td className="border-b p-3">
                          {formatNumber(row.binding_probability)}
                        </td>
                        <td className="border-b p-3">
                          {formatNumber(row.developability_risk_score)}
                        </td>
                        <td className="border-b p-3">
                          {formatNumber(
                            row.developability_risk_score_percentile
                          )}
                        </td>
                        <td className="border-b p-3">
                          {typeof row.hard_filter_pass === "boolean"
                            ? String(row.hard_filter_pass)
                            : "NA"}
                        </td>
                        <td className="border-b p-3">
                          {row.hard_filter_reasons ?? ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="p-4 text-sm text-slate-500">
                Scores are computational predictions and require experimental
                validation.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
