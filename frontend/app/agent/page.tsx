"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import SectionTitle from "../components/SectionTitle";
import {
  API_BASE,
  DEFAULT_ANTIGEN,
  DEFAULT_CDRH3,
  DEFAULT_HEAVY,
} from "../components/config";

type RecordRow = Record<string, unknown>;

type ChatMessage = {
  user: string;
  assistant: string;
};

type ControllerProgress = {
  job_id?: string;
  status?: string;
  message?: string;
  progress_percent?: number;
  current_round?: number;
  total_rounds?: number;
  selected_count?: number;
  target_count?: number;
  evaluated_count?: number;
  current_temperature?: number;
  current_min_binding_probability?: number;
  current_samples_per_round?: number;
  current_sampling_mode?: string;
  selected_records?: RecordRow[];
  history_records?: RecordRow[];
  latest_selected_preview?: RecordRow[];
  latest_history_preview?: RecordRow[];
  latest_round_preview?: RecordRow[];
  strategy_notes?: string[];
  summary?: string;
  error?: string;
};

const EXAMPLE_TARGET = "SARS-CoV2_Beta";

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

function downloadText(filename: string, text: string) {
  const blob = new Blob([text || ""], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function SimpleTable({
  rows,
  maxRows = 20,
}: {
  rows: RecordRow[];
  maxRows?: number;
}) {
  if (!rows || rows.length === 0) {
    return <div className="p-6 text-sm text-slate-500">No records yet.</div>;
  }

  const visibleRows = rows.slice(0, maxRows);
  const headers = Object.keys(visibleRows[0]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>
            {headers.map((header) => (
              <th key={header} className="border-b p-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {visibleRows.map((row, index) => (
            <tr key={index} className="hover:bg-slate-50">
              {headers.map((header) => (
                <td
                  key={header}
                  className="max-w-[360px] truncate border-b p-3"
                  title={String(row[header] ?? "")}
                >
                  {String(row[header] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length > maxRows && (
        <div className="border-t bg-slate-50 p-3 text-sm text-slate-500">
          Showing first {maxRows} of {rows.length} records.
        </div>
      )}
    </div>
  );
}

export default function AgentPage() {
  const [targets, setTargets] = useState<string[]>([]);
  const [targetsLoading, setTargetsLoading] = useState(true);
  const [targetsError, setTargetsError] = useState("");

  const [antigenName, setAntigenName] = useState("");
  const [antigenSequence, setAntigenSequence] = useState(DEFAULT_ANTIGEN);
  const [heavyTemplate, setHeavyTemplate] = useState(DEFAULT_HEAVY);
  const [cdrh3Template, setCdrh3Template] = useState(DEFAULT_CDRH3);

  const [targetCount, setTargetCount] = useState(10);
  const [minBindingProbability, setMinBindingProbability] = useState(0.8);
  const [maxRounds, setMaxRounds] = useState(4);

  const [summary, setSummary] = useState("");
  const [acceptedRecords, setAcceptedRecords] = useState<RecordRow[]>([]);
  const [historyRecords, setHistoryRecords] = useState<RecordRow[]>([]);
  const [acceptedDownloadUrl, setAcceptedDownloadUrl] = useState("");
  const [historyDownloadUrl, setHistoryDownloadUrl] = useState("");

  const [jobId, setJobId] = useState("");
  const [progress, setProgress] = useState<ControllerProgress | null>(null);

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    async function loadTargets() {
      setTargetsLoading(true);
      setTargetsError("");

      try {
        const response = await fetch(`${API_BASE}/targets`);

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Failed to load targets: ${response.status} ${text}`);
        }

        const data = await response.json();
        const loadedTargets = data.targets || [];

        if (!Array.isArray(loadedTargets) || loadedTargets.length === 0) {
          throw new Error("Backend returned an empty target list.");
        }

        const uniqueTargets = Array.from(
          new Set(loadedTargets.map((target: unknown) => String(target)))
        );

        const sortedTargets = uniqueTargets.sort((a, b) => {
          const aIsSars = a.toLowerCase().includes("sars");
          const bIsSars = b.toLowerCase().includes("sars");

          if (aIsSars && !bIsSars) return -1;
          if (!aIsSars && bIsSars) return 1;

          return a.localeCompare(b);
        });

        setTargets(sortedTargets);

        const savedTarget = localStorage.getItem("space_target_name");

        if (savedTarget && sortedTargets.includes(savedTarget)) {
          setAntigenName(savedTarget);
        } else if (sortedTargets.includes(EXAMPLE_TARGET)) {
          setAntigenName(EXAMPLE_TARGET);
        } else {
          setAntigenName(sortedTargets[0]);
        }
      } catch (err) {
        setTargetsError(String(err));
        setTargets([]);
        setAntigenName("");
      } finally {
        setTargetsLoading(false);
      }
    }

    const savedAntigen = localStorage.getItem("space_antigen");
    const savedTarget = localStorage.getItem("space_target_name");

    if (savedAntigen) {
      setAntigenSequence(savedAntigen);
    }

    if (savedTarget) {
      setAntigenName(savedTarget);
    }

    loadTargets();
  }, []);

  function loadExample() {
    const exampleTarget = targets.includes(EXAMPLE_TARGET)
      ? EXAMPLE_TARGET
      : targets.length > 0
      ? targets[0]
      : "";

    setAntigenName(exampleTarget);
    setAntigenSequence(DEFAULT_ANTIGEN);
    setHeavyTemplate(DEFAULT_HEAVY);
    setCdrh3Template(DEFAULT_CDRH3);
    setTargetCount(10);
    setMinBindingProbability(0.8);
    setMaxRounds(4);
    setSummary("");
    setAcceptedRecords([]);
    setHistoryRecords([]);
    setAcceptedDownloadUrl("");
    setHistoryDownloadUrl("");
    setJobId("");
    setProgress(null);
    setChatHistory([]);
    setError("");
    setChatError("");

    if (exampleTarget) {
      localStorage.setItem("space_target_name", exampleTarget);
    }
    localStorage.setItem("space_antigen", DEFAULT_ANTIGEN);
  }

  function downloadAllAgentResults() {
    const metadata = [
      {
        target_antigen_name: antigenName,
        target_count: targetCount,
        min_binding_probability: minBindingProbability,
        max_rounds: maxRounds,
        summary,
        accepted_count: acceptedRecords.length,
        history_count: historyRecords.length,
      },
    ];

    downloadCsv("llm_guided_design_metadata.csv", metadata);

    if (acceptedRecords.length > 0) {
      downloadCsv("llm_guided_design_selected_candidates.csv", acceptedRecords);
    }

    if (historyRecords.length > 0) {
      downloadCsv("llm_guided_design_search_history.csv", historyRecords);
    }

    if (summary) {
      downloadText("llm_guided_design_summary.txt", summary);
    }
  }

  async function runAgent() {
    setLoading(true);
    setError("");
    setSummary("");
    setAcceptedRecords([]);
    setHistoryRecords([]);
    setAcceptedDownloadUrl("");
    setHistoryDownloadUrl("");
    setJobId("");
    setProgress(null);

    try {
      if (!antigenName) {
        throw new Error("Please select a target antigen name.");
      }

      if (!antigenSequence.trim()) {
        throw new Error("Please provide an antigen sequence.");
      }

      if (!heavyTemplate.trim()) {
        throw new Error("Please provide a heavy-chain template.");
      }

      if (!cdrh3Template.trim()) {
        throw new Error("Please provide a template CDRH3.");
      }

      localStorage.setItem("space_target_name", antigenName);
      localStorage.setItem("space_antigen", antigenSequence);

      const startResponse = await fetch(`${API_BASE}/controller/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          antigen_name: antigenName,
          antigen_sequence: antigenSequence,
          heavy_template: heavyTemplate,
          cdrh3_template: cdrh3Template,
          target_count: targetCount,
          min_binding_probability: minBindingProbability,
          max_rounds: maxRounds,
        }),
      });

      if (!startResponse.ok) {
        const text = await startResponse.text();
        throw new Error(`API error: ${startResponse.status} ${text}`);
      }

      const startData = await startResponse.json();
      const newJobId = startData.job_id;

      if (!newJobId) {
        throw new Error("Backend did not return a job_id.");
      }

      setJobId(newJobId);

      let completed = false;

      while (!completed) {
        await sleep(2000);

        const statusResponse = await fetch(
          `${API_BASE}/controller/status/${newJobId}`
        );

        if (!statusResponse.ok) {
          const text = await statusResponse.text();
          throw new Error(`Status API error: ${statusResponse.status} ${text}`);
        }

        const statusData: ControllerProgress = await statusResponse.json();

        setProgress(statusData);

        const selected =
          statusData.latest_selected_preview ||
          statusData.selected_records ||
          [];

        const history =
          statusData.latest_history_preview ||
          statusData.history_records ||
          [];

        if (selected.length > 0) {
          setAcceptedRecords(selected);
        }

        if (history.length > 0) {
          setHistoryRecords(history);
        }

        if (statusData.summary) {
          setSummary(statusData.summary);
        }

        if (statusData.status === "error") {
          throw new Error(statusData.error || statusData.message || "Controller job failed.");
        }

        if (statusData.status === "completed") {
          completed = true;
        }
      }

      const resultResponse = await fetch(
        `${API_BASE}/controller/result/${newJobId}`
      );

      if (!resultResponse.ok) {
        const text = await resultResponse.text();
        throw new Error(`Result API error: ${resultResponse.status} ${text}`);
      }

      const data = await resultResponse.json();

      const selected =
        data.accepted_records ||
        data.selected_records ||
        data.selected_candidates ||
        data.selected ||
        data.candidates ||
        [];

      const history =
        data.history_records ||
        data.search_history ||
        data.search_records ||
        data.history ||
        data.all_records ||
        [];

      setSummary(data.summary || data.message || "");
      setAcceptedRecords(selected);
      setHistoryRecords(history);

      setAcceptedDownloadUrl(
        data.accepted_download_url ||
          data.selected_download_url ||
          data.selected_candidates_download_url ||
          data.controller_selected_download_url ||
          `${API_BASE}/download/controller_selected_candidates.csv`
      );

      setHistoryDownloadUrl(
        data.history_download_url ||
          data.search_history_download_url ||
          data.controller_history_download_url ||
          `${API_BASE}/download/controller_search_history.csv`
      );

      localStorage.setItem(
        "space_llm_design_accepted_records",
        JSON.stringify(selected)
      );
      localStorage.setItem(
        "space_llm_design_history_records",
        JSON.stringify(history)
      );
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function sendChat() {
    const message = chatInput.trim();

    if (!message) return;

    setChatLoading(true);
    setChatError("");

    try {
      const response = await fetch(`${API_BASE}/controller/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          antigen_name: antigenName,
          latest_summary_text: summary,
          accepted_records: acceptedRecords,
          history_records: historyRecords,
          chat_history: chatHistory,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error: ${response.status} ${text}`);
      }

      const data = await response.json();

      setChatHistory([
        ...chatHistory,
        {
          user: message,
          assistant: data.answer || "",
        },
      ]);

      setChatInput("");
    } catch (err) {
      setChatError(String(err));
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <section className="mx-auto max-w-7xl px-8 py-12">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <SectionTitle
            label="LLM-guided workflow"
            title="LLM-guided Antibody Design"
            description="Target-specific closed-loop optimization integrating antigen-conditioned generation, antibody-antigen binding prediction, developability assessment, and language-model-guided result interpretation."
          />

          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-semibold">
                Target antigen name
              </label>

              <select
                value={antigenName}
                onChange={(event) => {
                  setAntigenName(event.target.value);
                  localStorage.setItem("space_target_name", event.target.value);
                }}
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

              <div className="mt-2 text-xs text-slate-500">
                {targets.length > 0
                  ? `${targets.length} targets loaded from backend`
                  : "Targets are loaded from /targets"}
              </div>

              {targetsError && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {targetsError}
                </div>
              )}

              <label className="mb-2 mt-4 block text-sm font-semibold">
                Antigen amino-acid sequence
              </label>
              <textarea
                className="h-36 w-full rounded-xl border p-4 font-mono text-sm"
                value={antigenSequence}
                onChange={(event) => setAntigenSequence(event.target.value)}
              />

              <label className="mb-2 mt-4 block text-sm font-semibold">
                Heavy-chain template
              </label>
              <textarea
                className="h-32 w-full rounded-xl border p-4 font-mono text-sm"
                value={heavyTemplate}
                onChange={(event) => setHeavyTemplate(event.target.value)}
              />

              <label className="mb-2 mt-4 block text-sm font-semibold">
                Template CDRH3
              </label>
              <input
                className="w-full rounded-xl border p-3 font-mono text-sm"
                value={cdrh3Template}
                onChange={(event) => setCdrh3Template(event.target.value)}
              />

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Desired candidates
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={targetCount}
                    onChange={(event) =>
                      setTargetCount(Number(event.target.value))
                    }
                    className="w-full rounded-xl border p-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Minimum binding
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={minBindingProbability}
                    onChange={(event) =>
                      setMinBindingProbability(Number(event.target.value))
                    }
                    className="w-full rounded-xl border p-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Max rounds
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={maxRounds}
                    onChange={(event) =>
                      setMaxRounds(Number(event.target.value))
                    }
                    className="w-full rounded-xl border p-3"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={loadExample}
                  className="rounded-full border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Load example
                </button>

                <button
                  onClick={runAgent}
                  disabled={loading || targetsLoading || !antigenName}
                  className="rounded-full bg-blue-700 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {loading ? "Running design..." : "Run LLM-guided Design"}
                </button>

                <button
                  onClick={downloadAllAgentResults}
                  disabled={
                    !summary &&
                    acceptedRecords.length === 0 &&
                    historyRecords.length === 0
                  }
                  className="rounded-full bg-slate-900 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  Download All Results
                </button>
              </div>

              {error && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="lg:col-span-3">
              <div className="mb-6 rounded-2xl border bg-white p-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold">Search progress</h3>
                  {jobId && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      Job: {jobId.slice(0, 8)}
                    </span>
                  )}
                </div>

                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-blue-700 transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, progress?.progress_percent ?? 0)
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">Status</div>
                    <div className="font-semibold">
                      {progress?.status || (loading ? "running" : "idle")}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">Round</div>
                    <div className="font-semibold">
                      {progress?.current_round ?? 0}
                      {progress?.total_rounds ? ` / ${progress.total_rounds}` : ""}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">Selected</div>
                    <div className="font-semibold">
                      {progress?.selected_count ?? acceptedRecords.length} /{" "}
                      {progress?.target_count ?? targetCount}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">Evaluated</div>
                    <div className="font-semibold">
                      {progress?.evaluated_count ?? historyRecords.length}
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-600">
                  {progress?.message ||
                    "Progress will update every 2 seconds during the search."}
                </p>

                {progress?.strategy_notes && progress.strategy_notes.length > 0 && (
                  <div className="mt-4 rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
                    <div className="mb-2 font-semibold">Adaptive strategy notes</div>
                    <ul className="list-disc space-y-1 pl-5">
                      {progress.strategy_notes.map((note, index) => (
                        <li key={index}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mb-6 rounded-2xl border bg-slate-50 p-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold">Design summary</h3>

                  {summary && (
                    <button
                      onClick={() => downloadText("llm_guided_design_summary.txt", summary)}
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Download TXT
                    </button>
                  )}
                </div>

                {summary ? (
                  <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {summary}
                  </pre>
                ) : (
                  <p className="text-sm text-slate-500">
                    Design summary will appear here after the run.
                  </p>
                )}
              </div>

              <div className="mb-6 rounded-2xl border">
                <div className="flex items-center justify-between border-b bg-slate-100 px-4 py-3">
                  <h3 className="text-xl font-bold">Selected candidates</h3>

                  <div className="flex gap-2">
                    {acceptedRecords.length > 0 && (
                      <button
                        onClick={() =>
                          downloadCsv(
                            "llm_guided_design_selected_candidates.csv",
                            acceptedRecords
                          )
                        }
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Download CSV
                      </button>
                    )}

                    {acceptedDownloadUrl && (
                      <a
                        href={acceptedDownloadUrl}
                        download
                        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        Server CSV
                      </a>
                    )}
                  </div>
                </div>

                <SimpleTable rows={acceptedRecords} />
              </div>

              <div className="rounded-2xl border">
                <div className="flex items-center justify-between border-b bg-slate-100 px-4 py-3">
                  <h3 className="text-xl font-bold">Search history</h3>

                  <div className="flex gap-2">
                    {historyRecords.length > 0 && (
                      <button
                        onClick={() =>
                          downloadCsv(
                            "llm_guided_design_search_history.csv",
                            historyRecords
                          )
                        }
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Download CSV
                      </button>
                    )}

                    {historyDownloadUrl && (
                      <a
                        href={historyDownloadUrl}
                        download
                        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        Server CSV
                      </a>
                    )}
                  </div>
                </div>

                <SimpleTable rows={historyRecords} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
          <SectionTitle
            label="Run analysis"
            title="Result Q&A"
            description="Ask the language model to summarize the current run, explain bottlenecks, compare candidates, or suggest the next optimization round."
          />

          <div className="rounded-2xl border bg-slate-50 p-4">
            {chatHistory.length > 0 ? (
              <div className="space-y-4">
                {chatHistory.map((item, index) => (
                  <div key={index} className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-sm font-bold text-slate-900">User</p>
                    <p className="mt-1 text-sm text-slate-700">{item.user}</p>

                    <p className="mt-4 text-sm font-bold text-blue-700">
                      Assistant
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {item.assistant}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Ask a question before or after running the design workflow.
              </p>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            <input
              className="flex-1 rounded-xl border p-3 text-sm"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Example: Summarize this run, compare the top candidates, or explain why candidates were rejected."
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  sendChat();
                }
              }}
            />

            <button
              onClick={sendChat}
              disabled={chatLoading || chatInput.trim().length === 0}
              className="rounded-full bg-blue-700 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {chatLoading ? "Thinking..." : "Send"}
            </button>
          </div>

          {chatError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {chatError}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
