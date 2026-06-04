# ============================================================
# LLM-guided full pipeline Agent API
# Paste this at the bottom of backend/main.py
# Requires: agent_api.py with AntibodyDesignAgent
# ============================================================

from agent_api import AntibodyDesignAgent


DEFAULT_AGENT_TARGET_COUNT = 10


def normalize_chat_content(raw):
    if isinstance(raw, str):
        return raw.strip()

    if isinstance(raw, list):
        texts = []
        for item in raw:
            if isinstance(item, dict):
                if "text" in item:
                    texts.append(str(item["text"]))
                elif "content" in item:
                    texts.append(str(item["content"]))
            else:
                texts.append(str(item))
        return " ".join([t for t in texts if str(t).strip()]).strip()

    if isinstance(raw, dict):
        if "text" in raw:
            return str(raw.get("text", "")).strip()
        if "content" in raw:
            return str(raw.get("content", "")).strip()
        return str(raw)

    return str(raw).strip()


def history_pairs_to_text(history, max_turns: int = 6) -> str:
    if not history:
        return ""

    trimmed = history[-max_turns:]
    parts = []

    for item in trimmed:
        if isinstance(item, dict):
            user_msg = item.get("user", "")
            assistant_msg = item.get("assistant", "")
            if str(user_msg).strip():
                parts.append(f"User: {str(user_msg).strip()}")
            if str(assistant_msg).strip():
                parts.append(f"Assistant: {str(assistant_msg).strip()}")
        elif isinstance(item, (list, tuple)) and len(item) == 2:
            user_msg, assistant_msg = item
            if str(user_msg).strip():
                parts.append(f"User: {str(user_msg).strip()}")
            if str(assistant_msg).strip():
                parts.append(f"Assistant: {str(assistant_msg).strip()}")

    return "\n".join(parts)


def build_llm_agent() -> AntibodyDesignAgent:
    return AntibodyDesignAgent(
        generator=generator,
        binder=binder,
        ranker=ranker,
        llm_model=os.getenv("ANTIBODY_LLM_MODEL", "gpt-4o-mini"),
        base_url=os.getenv("ANTIBODY_LLM_BASE_URL", "https://api.openai.com/v1"),
        api_key=os.getenv("OPENAI_API_KEY", ""),
        output_dir=str(OUTPUT_DIR),
        app_name="SPACE Antibody Design",
        app_url=os.getenv(
            "ANTIBODY_APP_URL",
            "http://localhost:3000",
        ),
    )


llm_agent = build_llm_agent()


class AgentRunRequest(BaseModel):
    antigen_name: str
    antigen_sequence: str
    heavy_template: str
    cdrh3_template: str
    target_count: int = DEFAULT_AGENT_TARGET_COUNT
    min_binding_probability: float = 0.8
    max_rounds: int = 4
    user_request: str | None = None


class AgentChatRequest(BaseModel):
    message: str
    antigen_name: str | None = None
    latest_summary_text: str | None = ""
    accepted_records: list[dict] = []
    history_records: list[dict] = []
    chat_history: list[dict] = []


@app.post("/agent/run")
def run_agent_api(req: AgentRunRequest):
    try:
        if not req.antigen_sequence or not str(req.antigen_sequence).strip():
            raise ValueError("Please provide an antigen sequence.")

        if not req.heavy_template or not str(req.heavy_template).strip():
            raise ValueError("Please provide a heavy-chain template.")

        if not req.cdrh3_template or not str(req.cdrh3_template).strip():
            raise ValueError("Please provide a CDRH3 template.")

        target_count = int(req.target_count)

        user_request = req.user_request or (
            f"Please find {target_count} antibody candidates for {req.antigen_name} "
            f"with high predicted binding probability and good developability."
        )

        summary, accepted_df, history_df = llm_agent.run(
            user_request=user_request,
            antigen_name=req.antigen_name,
            antigen_sequence=req.antigen_sequence,
            heavy_template=req.heavy_template,
            cdrh3_template=req.cdrh3_template,
            default_target_count=target_count,
            max_rounds=int(req.max_rounds),
            min_binding_probability=float(req.min_binding_probability),
        )

        accepted_path = OUTPUT_DIR / "agent_accepted_candidates.csv"
        history_path = OUTPUT_DIR / "agent_search_history.csv"

        accepted_df.to_csv(accepted_path, index=False)
        history_df.to_csv(history_path, index=False)

        return {
            "summary": summary,
            "accepted_count": len(accepted_df),
            "history_count": len(history_df),
            "accepted_records": accepted_df.to_dict(orient="records"),
            "history_records": history_df.to_dict(orient="records"),
            "accepted_download_url": "http://127.0.0.1:8000/download/agent_accepted_candidates.csv",
            "history_download_url": "http://127.0.0.1:8000/download/agent_search_history.csv",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/chat")
def agent_chat_api(req: AgentChatRequest):
    try:
        message = str(req.message or "").strip()

        if not message:
            raise ValueError("Please enter a message.")

        accepted_df = pd.DataFrame(req.accepted_records or [])
        history_df = pd.DataFrame(req.history_records or [])
        history_text = history_pairs_to_text(req.chat_history, max_turns=6)

        if len(accepted_df) == 0 and len(history_df) == 0:
            answer = llm_agent._chat_text(
                system_prompt="""
You are an antibody design assistant.
Answer general questions about antibody design, antigen-specific design,
CDRH3 generation, binding prediction, and developability.
Be concise, helpful, and scientifically grounded.
If the user asks about current run results, explain that no run has been executed yet.
""",
                user_prompt=f"""
User question:
{message}

Current target:
{req.antigen_name}

Recent conversation:
{history_text}

There is no completed design run yet.
""",
                temperature=0.3,
            )

            return {"answer": normalize_chat_content(answer)}

        answer = llm_agent._chat_text(
            system_prompt="""
You are an antibody design analysis assistant.
Answer questions about the current run.
Stay grounded in the provided results.
Do not invent unsupported facts.
Be concise and factual.
""",
            user_prompt=f"""
User question:
{message}

Current antigen:
{req.antigen_name}

Latest run summary:
{req.latest_summary_text}

Accepted stats:
{accepted_df.head(8).to_dict(orient="records")}

History stats:
{history_df.head(12).to_dict(orient="records")}

Recent conversation:
{history_text}
""",
            temperature=0.2,
        )

        return {"answer": normalize_chat_content(answer)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/download/agent_accepted_candidates.csv")
def download_agent_accepted_candidates():
    file_path = OUTPUT_DIR / "agent_accepted_candidates.csv"

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="No agent accepted candidate file found. Please run the agent first.",
        )

    return FileResponse(
        path=str(file_path),
        media_type="text/csv",
        filename="agent_accepted_candidates.csv",
    )


@app.get("/download/agent_search_history.csv")
def download_agent_search_history():
    file_path = OUTPUT_DIR / "agent_search_history.csv"

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="No agent search history file found. Please run the agent first.",
        )

    return FileResponse(
        path=str(file_path),
        media_type="text/csv",
        filename="agent_search_history.csv",
    )
