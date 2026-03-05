import SectionTitle from "./SectionTitle";
import SmallInput from "./SmallInput";

export default function BankAccountSection({ bankAccount, setState }) {
  return (
    <div className="rounded-xl border border-[#E6E6E6] p-4">
      <SectionTitle title="Conta bancária do projeto" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SmallInput
          value={bankAccount.bankName}
          onChange={(v) =>
            setState((p) => ({
              ...p,
              bankAccount: { ...p.bankAccount, bankName: v },
            }))
          }
          placeholder="Nome do banco"
        />
        <SmallInput
          value={bankAccount.bankCode}
          onChange={(v) =>
            setState((p) => ({
              ...p,
              bankAccount: { ...p.bankAccount, bankCode: v },
            }))
          }
          placeholder="Código do banco"
        />
        <SmallInput
          value={bankAccount.agency}
          onChange={(v) =>
            setState((p) => ({
              ...p,
              bankAccount: { ...p.bankAccount, agency: v },
            }))
          }
          placeholder="Agência (sem dígito)"
        />
        <div className="grid grid-cols-2 gap-3">
          <SmallInput
            value={bankAccount.account}
            onChange={(v) =>
              setState((p) => ({
                ...p,
                bankAccount: { ...p.bankAccount, account: v },
              }))
            }
            placeholder="Conta"
          />
          <SmallInput
            value={bankAccount.digit}
            onChange={(v) =>
              setState((p) => ({
                ...p,
                bankAccount: { ...p.bankAccount, digit: v },
              }))
            }
            placeholder="Dígito"
          />
        </div>
      </div>
    </div>
  );
}
