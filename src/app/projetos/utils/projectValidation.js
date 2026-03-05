import { clampInt } from "./numberUtils";

export function validateProjectForm(state) {
  if (!state.name?.trim()) {
    return "Preencha o nome do projeto.";
  }
  if (String(state.summary || "").length > 700) {
    return "O resumo deve ter no máximo 700 caracteres.";
  }
  if (String(state.beneficiariesProfile || "").length > 300) {
    return "O perfil dos beneficiários deve ter no máximo 300 caracteres.";
  }
  if (String(state.justification || "").length > 5000) {
    return "A justificativa deve ter no máximo 5.000 caracteres.";
  }

  // Validate goals months
  const duration = clampInt(state.durationMonths || 12, 1, 120);
  for (let i = 0; i < state.goals.length; i += 1) {
    const g = state.goals[i];
    const ms = Number(g.monthStart || 0);
    const me = Number(g.monthEnd || 0);
    if (ms && (ms < 1 || ms > duration)) {
      return `Meta ${i + 1}: mês de início inválido.`;
    }
    if (me && (me < 1 || me > duration)) {
      return `Meta ${i + 1}: mês de fim inválido.`;
    }
    if (ms && me && me < ms) {
      return `Meta ${i + 1}: mês fim não pode ser menor que início.`;
    }

    const stages = Array.isArray(g.stages) ? g.stages : [];
    for (let j = 0; j < stages.length; j += 1) {
      const s = stages[j];
      const sms = Number(s.monthStart || 0);
      const sme = Number(s.monthEnd || 0);
      if (sms && ms && sms < ms) {
        return `Etapa ${i + 1}.${j + 1}: não pode começar antes da meta.`;
      }
      if (sme && me && sme > me) {
        return `Etapa ${i + 1}.${j + 1}: não pode terminar depois da meta.`;
      }
      if (sms && sme && sme < sms) {
        return `Etapa ${i + 1}.${j + 1}: mês fim não pode ser menor que início.`;
      }
    }
  }

  return null;
}
