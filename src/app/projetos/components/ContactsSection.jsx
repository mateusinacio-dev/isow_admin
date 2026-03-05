import SectionTitle from "./SectionTitle";
import SmallInput from "./SmallInput";

export default function ContactsSection({
  contacts,
  setContactField,
  addContactRow,
}) {
  return (
    <div>
      <SectionTitle title="Contatos" subtitle="Nome • e-mail • celular" />
      <div className="space-y-3">
        {(contacts || []).map((c, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SmallInput
              value={c.name}
              onChange={(v) => setContactField(idx, "name", v)}
              placeholder="Nome"
            />
            <SmallInput
              value={c.email}
              onChange={(v) => setContactField(idx, "email", v)}
              placeholder="E-mail"
              type="email"
            />
            <SmallInput
              value={c.phone}
              onChange={(v) => setContactField(idx, "phone", v)}
              placeholder="Celular"
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addContactRow}
          className="text-sm font-inter text-[#111827] underline"
        >
          + Adicionar contato
        </button>
      </div>
    </div>
  );
}
