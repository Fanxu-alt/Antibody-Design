export const TARGET_DISPLAY_NAMES: Record<string, string> = {
  hiv_gp120: "HIV gp120",
  hiv_gp160: "HIV gp160",
  influenza_ha: "Influenza hemagglutinin (HA)",
  neuraminidase: "Influenza neuraminidase (NA)",
  circumsporozoite: "Plasmodium circumsporozoite protein (CSP)",
};

const PRIORITY = [
  "hiv_gp120",
  "hiv_gp160",
  "influenza_ha",
  "neuraminidase",
  "circumsporozoite",
];

export function getTargetDisplayName(name: string) {
  return TARGET_DISPLAY_NAMES[name] || name;
}

export function sortTargets(targets: string[]) {
  return [...new Set(targets)].sort((a, b) => {
    const ai = PRIORITY.indexOf(a);
    const bi = PRIORITY.indexOf(b);

    // 五类不同病原体固定排最前
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;

    // SARS-CoV-2 及其变体统一排后
    const aIsSars = a.toLowerCase().includes("sars");
    const bIsSars = b.toLowerCase().includes("sars");

    if (aIsSars && !bIsSars) return 1;
    if (!aIsSars && bIsSars) return -1;

    return a.localeCompare(b);
  });
}
