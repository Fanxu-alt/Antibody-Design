"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import SectionTitle from "../components/SectionTitle";
import { API_BASE, DEFAULT_ANTIGEN } from "../components/config";

type GeneratedCandidate = {
  antigen?: string;
  cdrh3: string;
  pred_len?: number;
  sample_mode?: string;
  temperature?: number;
};

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

export default function GeneratePage() {
  const [antigen, setAntigen] = useState("");
  const [numSamples, setNumSamples] = useState(32);
  const [minLen, setMinLen] = useState(8);
  const [sampleMode, setSampleMode] = useState("sample");
  const [temperature, setTemperature] = useState(1.0);
  const [deduplicate, setDeduplicate] = useState(true);

  const [summary, setSummary] = useState("");
  const [results, setResults] = useState<GeneratedCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function loadExample() {
    setAntigen(DEFAULT_ANTIGEN);
    setNumSamples(32);
    setMinLen(8);
    setSampleMode("sample");
    setTemperature(1.0);
    setDeduplicate(true);
    setSummary("");
    setResults([]);
    setError("");
  }

  function downloadGeneratedResults() {
    const rows = results.map((row, index) => ({
      rank: index + 1,
      cdrh3: row.cdrh3,
      pred_len: row.pred_len ?? "",
      sample_mode: row.sample_mode ?? sampleMode,
      temperature: row.temperature ?? temperature,
      antigen: row.antigen ?? antigen,
    }));

    downloadCsv("generated_cdrh3_candidates.csv", rows);
  }

  async function runGenerate() {
    setLoading(true);
    setError("");
    setSummary("");
    setResults([]);

    try {
      const response = await fetch(`${API_BASE}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          antigen,
          num_samples: numSamples,
          min_len: minLen,
          sample_mode: sampleMode,
          temperature,
          deduplicate,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error: ${response.status} ${text}`);
      }

      const data = await response.json();
      const candidates = data.candidates || [];

      localStorage.setItem("space_generated_candidates", JSON.stringify(candidates));
      localStorage.setItem("space_antigen", antigen);

      setResults(candidates);
      setSummary(
        [
          `Generated candidates: ${data.count ?? candidates.length}`,
          `Minimum CDRH3 length: ${minLen}`,
          `Sampling mode: ${sampleMode}`,
          `Generation diversity temperature: ${temperature}`,
          `Remove duplicate CDRH3 sequences: ${deduplicate ? "Yes" : "No"}`,
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
            label="Module 01"
            title="Generate"
            description="Generate antigen-conditioned CDRH3 candidates from an input antigen amino-acid sequence."
          />

          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-semibold">
                Antigen amino-acid sequence
              </label>
              <textarea
                className="h-56 w-full rounded-xl border p-4 font-mono text-sm"
                placeholder="Paste antigen amino-acid sequence here..."
                value={antigen}
                onChange={(event) => setAntigen(event.target.value)}
              />

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Number of generated CDRH3 samples
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={numSamples}
                    onChange={(event) => setNumSamples(Number(event.target.value))}
                    className="w-full rounded-xl border p-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Minimum CDRH3 length
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={30}
                    value={minLen}
                    onChange={(event) => setMinLen(Number(event.target.value))}
                    className="w-full rounded-xl border p-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Sampling mode
                  </label>
                  <select
                    value={sampleMode}
                    onChange={(event) => setSampleMode(event.target.value)}
                    className="w-full rounded-xl border p-3"
                  >
                    <option value="sample">sample</option>
                    <option value="argmax">argmax</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Generation diversity temperature
                  </label>
                  <input
                    type="number"
                    min={0.2}
                    max={2.0}
                    step={0.1}
                    value={temperature}
                    onChange={(event) => setTemperature(Number(event.target.value))}
                    className="w-full rounded-xl border p-3"
                  />
                </div>
              </div>

              <label className="mt-4 flex items-center gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={deduplicate}
                  onChange={(event) => setDeduplicate(event.target.checked)}
                  className="h-4 w-4"
                />
                Remove duplicate CDRH3 sequences
              </label>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={loadExample}
                  className="rounded-full border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Load example
                </button>

                <button
                  onClick={runGenerate}
                  disabled={loading || antigen.trim().length === 0}
                  className="rounded-full bg-blue-700 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {loading ? "Generating..." : "Generate CDRH3"}
                </button>

                <button
                  onClick={downloadGeneratedResults}
                  disabled={results.length === 0}
                  className="rounded-full bg-slate-900 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  Download CSV
                </button>
              </div>

              {error && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="lg:col-span-3">
              <div className="mb-6 rounded-2xl border bg-slate-50 p-6">
                <h3 className="mb-3 text-xl font-bold">Run summary</h3>
                {summary ? (
                  <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {summary}
                  </pre>
                ) : (
                  <p className="text-sm text-slate-500">
                    Run summary will appear here after generation.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border">
                <div className="flex items-center justify-between border-b bg-slate-100 px-4 py-3">
                  <h3 className="text-xl font-bold">Generated CDRH3 candidate</h3>
                  {results.length > 0 && (
                    <button
                      onClick={downloadGeneratedResults}
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Download CSV
                    </button>
                  )}
                </div>

                {results.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse bg-white text-sm">
                      <thead className="bg-slate-50 text-left">
                        <tr>
                          <th className="border-b p-3">Rank</th>
                          <th className="border-b p-3">CDRH3</th>
                          <th className="border-b p-3">Predicted length</th>
                          <th className="border-b p-3">Sampling mode</th>
                          <th className="border-b p-3">Temperature</th>
                        </tr>
                      </thead>

                      <tbody>
                        {results.map((row, index) => (
                          <tr
                            key={`${row.cdrh3}-${index}`}
                            className="hover:bg-slate-50"
                          >
                            <td className="border-b p-3">{index + 1}</td>
                            <td className="border-b p-3 font-mono font-semibold text-blue-700">
                              {row.cdrh3}
                            </td>
                            <td className="border-b p-3">
                              {row.pred_len ?? "NA"}
                            </td>
                            <td className="border-b p-3">
                              {row.sample_mode ?? sampleMode}
                            </td>
                            <td className="border-b p-3">
                              {row.temperature ?? temperature}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-sm text-slate-500">
                    Generated CDRH3 candidates will appear here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
