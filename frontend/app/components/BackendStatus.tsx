"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "./config";

type Status = "checking" | "online" | "offline";

export default function BackendStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("Checking backend...");

  async function checkBackend() {
    try {
      setStatus("checking");
      setMessage("Checking backend...");

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${API_BASE}/targets`, {
        method: "GET",
        signal: controller.signal,
      });

      window.clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data.targets) && data.targets.length > 0) {
        setStatus("online");
        setMessage(`Backend online · ${data.targets.length} targets`);
      } else {
        setStatus("offline");
        setMessage("Backend reachable but no targets loaded");
      }
    } catch {
      setStatus("offline");
      setMessage("Backend waking up or offline");
    }
  }

  useEffect(() => {
    checkBackend();

    const interval = window.setInterval(() => {
      checkBackend();
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  const dotClass =
    status === "online"
      ? "bg-emerald-500"
      : status === "checking"
      ? "bg-amber-400"
      : "bg-red-500";

  const textClass =
    status === "online"
      ? "text-emerald-700"
      : status === "checking"
      ? "text-amber-700"
      : "text-red-700";

  return (
    <button
      type="button"
      onClick={checkBackend}
      title={message}
      className="flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-slate-50"
    >
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      <span className={textClass}>
        {status === "online"
          ? "Backend Online"
          : status === "checking"
          ? "Checking"
          : "Backend Waking"}
      </span>
    </button>
  );
}
