import SectionTitle from "./SectionTitle";

export default function BasicInfoSection({
  state,
  setState,
  remainingSummary,
}) {
  return (
    <div>
      <SectionTitle title="Nome do projeto" />
      <input
        value={state.name}
        onChange={(e) => setState((p) => ({ ...p, name: e.target.value }))}
        className="h-11 w-full px-4 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
        placeholder="Ex: Projeto XYZ"
      />

      <div className="mt-6">
        <SectionTitle
          title="Resumo (máximo 700 caracteres)"
          subtitle={`Restam ${remainingSummary} caracteres`}
        />
        <textarea
          value={state.summary}
          onChange={(e) => setState((p) => ({ ...p, summary: e.target.value }))}
          rows={5}
          className="w-full px-4 py-3 rounded-xl bg-white border border-[#E5E5E5] text-sm font-inter outline-none"
          placeholder="Resumo do projeto…"
        />
      </div>
    </div>
  );
}
