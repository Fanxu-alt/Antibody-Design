import os
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from huggingface_hub import hf_hub_download

from generate_api import AntibodyGenerator
from binder_api import AntibodyBinder
from developability_api import DevelopabilityRanker


# ============================================================
# Paths
# ============================================================

APP_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = APP_DIR / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_API_BASE = os.getenv("PUBLIC_API_BASE", "http://127.0.0.1:8000").rstrip("/")
BASE_DEV_CSV_PATH = APP_DIR / "filtered_Label_1.csv"

ADDITIONAL_TARGET_FILES = {
    "hiv_gp120": APP_DIR / "hiv_gp120_positive.csv",
    "hiv_gp160": APP_DIR / "hiv_gp160_positive.csv",
    "neuraminidase": APP_DIR / "neuraminidase_positive.csv",
    "influenza_ha": APP_DIR / "influenza_ha_positive.csv",
    "circumsporozoite": APP_DIR / "circumsporozoite_positive.csv",
}

COMBINED_DEV_CSV_PATH = OUTPUT_DIR / "combined_developability_reference.csv"
FULL_PIPELINE_CSV_PATH = OUTPUT_DIR / "full_pipeline_results.csv"


# ============================================================
# Model checkpoints
# ============================================================

GEN_MODEL_PATH = hf_hub_download(
    repo_id="Fanxu-alt/antibody-models",
    filename="conditional_cvae_finetune.pt",
)

BINDER_MODEL_PATH = hf_hub_download(
    repo_id="Fanxu-alt/antibody-models",
    filename="best_esm2_cross_attention.pt",
)


# ============================================================
# Developability reference construction
# ============================================================

def build_combined_developability_csv() -> Path:
    """
    filtered_Label_1.csv already has Target for SARS-CoV-2 variants.
    The additional antigen CSV files do not have Target, so we add Target
    based on the file name / antigen name and then combine everything.
    """
    if not BASE_DEV_CSV_PATH.exists():
        raise FileNotFoundError(f"Missing base developability file: {BASE_DEV_CSV_PATH}")

    base_df = pd.read_csv(BASE_DEV_CSV_PATH)

    if "Target" not in base_df.columns:
        raise ValueError("filtered_Label_1.csv must contain a Target column.")

    dfs = [base_df]

    for target_name, csv_path in ADDITIONAL_TARGET_FILES.items():
        if not csv_path.exists():
            print(f"[Warning] missing additional target file: {csv_path}")
            continue

        df = pd.read_csv(csv_path)
        df["Target"] = target_name

        # Make additional files compatible with filtered_Label_1.csv
        for col in base_df.columns:
            if col not in df.columns:
                df[col] = pd.NA

        # Keep exactly the same columns as the base file
        df = df[base_df.columns]
        dfs.append(df)

    combined_df = pd.concat(dfs, ignore_index=True)
    combined_df.to_csv(COMBINED_DEV_CSV_PATH, index=False)

    print(
        f"[Info] combined developability file saved: {COMBINED_DEV_CSV_PATH}, "
        f"targets={combined_df['Target'].nunique()}, rows={len(combined_df)}"
    )

    return COMBINED_DEV_CSV_PATH


# ============================================================
# Load models
# ============================================================

generator = AntibodyGenerator(GEN_MODEL_PATH)
binder = AntibodyBinder(BINDER_MODEL_PATH)

DEV_CSV_PATH = build_combined_developability_csv()
ranker = DevelopabilityRanker(str(DEV_CSV_PATH))


# ============================================================
# FastAPI app
# ============================================================

app = FastAPI(title="SPACE Antibody Design API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Request schemas
# ============================================================

class GenerateRequest(BaseModel):
    antigen: str
    num_samples: int = 16
    min_len: int = 8
    sample_mode: str = "sample"
    temperature: float = 1.0
    deduplicate: bool = True


class BindingRequest(BaseModel):
    heavy_seq: str
    antigen_seq: str


class FullPipelineRequest(BaseModel):
    antigen: str
    target_name: str
    template_heavy: str
    template_cdrh3: str
    num_samples: int = 10
    min_len: int = 8
    sample_mode: str = "sample"
    temperature: float = 1.0
    deduplicate: bool = True


# ============================================================
# Utility functions
# ============================================================

def clean_sequence(seq: str) -> str:
    return str(seq or "").strip().upper().replace(" ", "").replace("\n", "")


def graft_cdrh3_into_heavy(
    template_heavy: str,
    template_cdrh3: str,
    new_cdrh3: str,
) -> str:
    template_heavy = clean_sequence(template_heavy)
    template_cdrh3 = clean_sequence(template_cdrh3)
    new_cdrh3 = clean_sequence(new_cdrh3)

    if not template_heavy:
        raise ValueError("Template heavy-chain sequence is empty.")

    if not template_cdrh3:
        raise ValueError("Template CDRH3 sequence is empty.")

    if template_cdrh3 not in template_heavy:
        raise ValueError(
            "Template CDRH3 was not found inside the template heavy-chain sequence."
        )

    return template_heavy.replace(template_cdrh3, new_cdrh3, 1)


def detect_generated_cdr3_column(df: pd.DataFrame) -> str:
    for col in ["cdrh3", "cdr3", "sequence", "generated_cdrh3"]:
        if col in df.columns:
            return col

    raise ValueError(
        "Could not find generated CDRH3 column. Expected one of: "
        "cdrh3, cdr3, sequence, generated_cdrh3."
    )


def normalize_target_name(target_name: str) -> str:
    """
    Keep SARS-CoV-2 variant names as provided by filtered_Label_1.csv.
    For newly added antigen files, use lowercase target names.
    """
    target_name = str(target_name or "").strip()

    alias_map = {
        "HIV_gp120": "hiv_gp120",
        "HIV_gp160": "hiv_gp160",
        "Influenza_Hemagglutinin_HA": "influenza_ha",
        "Influenza_Neuraminidase_NA": "neuraminidase",
        "Plasmodium_Circumsporozoite_Protein_CSP": "circumsporozoite",
    }

    return alias_map.get(target_name, target_name)


def safe_float(value):
    if pd.isna(value):
        return None
    try:
        return float(value)
    except Exception:
        return None


# ============================================================
# Routes
# ============================================================

@app.get("/")
def home():
    return {
        "message": "SPACE Antibody Design API is running.",
        "docs": f"{PUBLIC_API_BASE}/docs",
    }


@app.get("/targets")
def list_targets():
    return {
        "targets": ranker.list_targets()
    }


@app.get("/debug-targets")
def debug_targets():
    """
    Useful for checking exact Target names available in the combined reference.
    """
    return {
        "targets": sorted(
            pd.read_csv(DEV_CSV_PATH)["Target"]
            .dropna()
            .astype(str)
            .unique()
            .tolist()
        )
    }


@app.post("/generate")
def generate_cdrh3(req: GenerateRequest):
    try:
        antigen = clean_sequence(req.antigen)

        if not antigen:
            raise ValueError("Please provide an antigen sequence.")

        df = generator.generate(
            antigen=antigen,
            num_samples=int(req.num_samples),
            min_len=int(req.min_len),
            sample_mode=req.sample_mode,
            temperature=float(req.temperature),
            deduplicate=bool(req.deduplicate),
        )

        return {
            "count": len(df),
            "candidates": df.to_dict(orient="records"),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict-binding")
def predict_binding(req: BindingRequest):
    try:
        heavy_seq = clean_sequence(req.heavy_seq)
        antigen_seq = clean_sequence(req.antigen_seq)

        if not heavy_seq:
            raise ValueError("Please provide a heavy-chain sequence.")

        if not antigen_seq:
            raise ValueError("Please provide an antigen sequence.")

        result = binder.predict(
            heavy_seq=heavy_seq,
            antigen_seq=antigen_seq,
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/full-pipeline")
def full_pipeline(req: FullPipelineRequest):
    try:
        antigen = clean_sequence(req.antigen)
        template_heavy = clean_sequence(req.template_heavy)
        template_cdrh3 = clean_sequence(req.template_cdrh3)
        target_name = normalize_target_name(req.target_name)

        if not antigen:
            raise ValueError("Please provide an antigen sequence.")

        if not template_heavy:
            raise ValueError("Please provide a heavy-chain template.")

        if not template_cdrh3:
            raise ValueError("Please provide a template CDRH3 sequence.")

        gen_df = generator.generate(
            antigen=antigen,
            num_samples=int(req.num_samples),
            min_len=int(req.min_len),
            sample_mode=req.sample_mode,
            temperature=float(req.temperature),
            deduplicate=bool(req.deduplicate),
        )

        if gen_df is None or len(gen_df) == 0:
            raise ValueError("No CDRH3 candidates were generated.")

        cdr3_col = detect_generated_cdr3_column(gen_df)

        binding_records = []
        dev_candidates = []

        for i, row in gen_df.iterrows():
            cdrh3 = clean_sequence(row[cdr3_col])
            candidate_name = f"C{i + 1}"

            full_heavy = graft_cdrh3_into_heavy(
                template_heavy=template_heavy,
                template_cdrh3=template_cdrh3,
                new_cdrh3=cdrh3,
            )

            bind_result = binder.predict(
                heavy_seq=full_heavy,
                antigen_seq=antigen,
            )

            binding_records.append({
                "candidate_name": candidate_name,
                "target_name": target_name,
                "cdrh3": cdrh3,
                "heavy_chain": full_heavy,
                "binding_probability": bind_result.get("binding_probability"),
                "binding_logit": bind_result.get("logit"),
            })

            dev_candidates.append({
                "candidate_name": candidate_name,
                "Target": target_name,
                "Heavy": full_heavy,
                "cdr3": cdrh3,
            })

        bind_df = pd.DataFrame(binding_records)

        dev_df = ranker.score_candidates(
            target_name=target_name,
            candidates=dev_candidates,
        )

        merged = bind_df.merge(dev_df, on="candidate_name", how="left")

        # Convert boolean-like values consistently
        if "hard_filter_pass" in merged.columns:
            merged["hard_filter_pass"] = merged["hard_filter_pass"].astype(bool)

        # Ranking strategy:
        # 1. Candidates passing hard developability filters first
        # 2. Higher binding probability first
        # 3. Lower developability risk score first
        sort_cols = []
        ascending = []

        if "hard_filter_pass" in merged.columns:
            sort_cols.append("hard_filter_pass")
            ascending.append(False)

        if "binding_probability" in merged.columns:
            sort_cols.append("binding_probability")
            ascending.append(False)

        if "developability_risk_score" in merged.columns:
            sort_cols.append("developability_risk_score")
            ascending.append(True)

        if sort_cols:
            merged = merged.sort_values(
                by=sort_cols,
                ascending=ascending,
            ).reset_index(drop=True)

        if "rank" in merged.columns:
            merged = merged.drop(columns=["rank"])

        merged.insert(0, "rank", range(1, len(merged) + 1))

        # Save CSV for download
        merged.to_csv(FULL_PIPELINE_CSV_PATH, index=False)

        return {
            "count": len(merged),
            "target_name": target_name,
            "download_url": f"{PUBLIC_API_BASE}/download/full_pipeline_results.csv",
            "results": merged.to_dict(orient="records"),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/download/full_pipeline_results.csv")
def download_full_pipeline_results():
    if not FULL_PIPELINE_CSV_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="No full pipeline result file found. Please run the pipeline first.",
        )

    return FileResponse(
        path=str(FULL_PIPELINE_CSV_PATH),
        media_type="text/csv",
        filename="full_pipeline_results.csv",
    )
# ============================================================
# Developability-only scoring API
# Paste this at the bottom of backend/main.py
# ============================================================

class DevelopabilityCandidate(BaseModel):
    candidate_name: str
    cdrh3: str
    heavy_chain: str
    binding_probability: float | None = None
    binding_logit: float | None = None


class DevelopabilityScoreRequest(BaseModel):
    target_name: str
    candidates: list[DevelopabilityCandidate]


@app.post("/score-developability")
def score_developability(req: DevelopabilityScoreRequest):
    try:
        target_name = normalize_target_name(req.target_name)

        if not req.candidates:
            raise ValueError("Please provide at least one candidate.")

        dev_candidates = []
        binding_records = []

        for i, candidate in enumerate(req.candidates):
            candidate_name = candidate.candidate_name or f"C{i + 1}"
            heavy_chain = clean_sequence(candidate.heavy_chain)
            cdrh3 = clean_sequence(candidate.cdrh3)

            if not heavy_chain:
                raise ValueError(f"Candidate {candidate_name} has empty heavy_chain.")

            if not cdrh3:
                raise ValueError(f"Candidate {candidate_name} has empty cdrh3.")

            dev_candidates.append({
                "candidate_name": candidate_name,
                "Target": target_name,
                "Heavy": heavy_chain,
                "cdr3": cdrh3,
            })

            binding_records.append({
                "candidate_name": candidate_name,
                "target_name": target_name,
                "cdrh3": cdrh3,
                "heavy_chain": heavy_chain,
                "binding_probability": candidate.binding_probability,
                "binding_logit": candidate.binding_logit,
            })

        bind_df = pd.DataFrame(binding_records)

        dev_df = ranker.score_candidates(
            target_name=target_name,
            candidates=dev_candidates,
        )

        merged = bind_df.merge(dev_df, on="candidate_name", how="left")

        if "hard_filter_pass" in merged.columns:
            merged["hard_filter_pass"] = merged["hard_filter_pass"].astype(bool)

        sort_cols = []
        ascending = []

        if "hard_filter_pass" in merged.columns:
            sort_cols.append("hard_filter_pass")
            ascending.append(False)

        if "binding_probability" in merged.columns:
            sort_cols.append("binding_probability")
            ascending.append(False)

        if "developability_risk_score" in merged.columns:
            sort_cols.append("developability_risk_score")
            ascending.append(True)

        if sort_cols:
            merged = merged.sort_values(
                by=sort_cols,
                ascending=ascending,
            ).reset_index(drop=True)

        if "rank" in merged.columns:
            merged = merged.drop(columns=["rank"])

        merged.insert(0, "rank", range(1, len(merged) + 1))

        out_csv = OUTPUT_DIR / "developability_results.csv"
        merged.to_csv(out_csv, index=False)

        return {
            "count": len(merged),
            "target_name": target_name,
            "download_url": f"{PUBLIC_API_BASE}/download/developability_results.csv",
            "results": merged.to_dict(orient="records"),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/download/developability_results.csv")
def download_developability_results():
    file_path = OUTPUT_DIR / "developability_results.csv"

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="No developability result file found. Please run developability scoring first.",
        )

    return FileResponse(
        path=str(file_path),
        media_type="text/csv",
        filename="developability_results.csv",
    )
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
            "accepted_download_url": f"{PUBLIC_API_BASE}/download/agent_accepted_candidates.csv",
            "history_download_url": f"{PUBLIC_API_BASE}/download/agent_search_history.csv",
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
