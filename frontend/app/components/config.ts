export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export const DEFAULT_ANTIGEN =
  "RVQPTESIVRFPNITNLCPFGEVFNATRFASVYAWNRKRISNCVADYSVLYNSASFSTFKCYGVSPTKLNDLCFTNVYADSFVIR";

export const DEFAULT_HEAVY =
  "EVQLVESGGGLVQPGGSLRLSCAASGITVSSNYMTWVRQAPGKGLEWVSVIYSGGSTFYADSVRGRFTISRDNSKNTLYLQMNSLRAEDTAVYYCARDLEMAGAFDIWGQGTMVTVSS";

export const DEFAULT_CDRH3 = "ARDLEMAGAFDI";

export const TARGETS = [
  "hiv_gp120",
  "hiv_gp160",
  "neuraminidase",
  "influenza_ha",
  "circumsporozoite",
  "SARS-CoV2_Beta",
];

export function formatNumber(value?: number, digits = 4) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "NA";
  }

  return value.toFixed(digits);
}
