import { TextInput } from "./FormInputs";
import { formatIsoDateBR } from "../utils/dateFormatters";

export function TicketCategoriesTable({
  categories,
  ticketDays,
  onChangeCategory,
  onRemoveCategory,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[860px] w-full border-separate border-spacing-0">
        <thead>
          <tr className="text-left">
            <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
              Categoria
            </th>
            <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
              Dia / Pacote
            </th>
            <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
              Valor (R$)
            </th>
            <th className="text-xs font-semibold text-[#6B7280] font-inter py-2">
              Quantidade
            </th>
            <th className="text-xs font-semibold text-[#6B7280] font-inter py-2"></th>
          </tr>
        </thead>
        <tbody>
          {(categories || []).map((c, idx) => {
            const isLast = idx === categories.length - 1;
            const hasName = Boolean(String(c.name || "").trim());
            const showRemove = !isLast || hasName;

            return (
              <tr key={idx} className="border-t border-[#F3F4F6]">
                <td className="py-3 pr-2">
                  <TextInput
                    value={c.name}
                    onChange={(e) =>
                      onChangeCategory(idx, { name: e.target.value })
                    }
                    placeholder="Ex: Inteira"
                  />
                </td>
                <td className="py-3 pr-2">
                  <select
                    value={c.dateKey}
                    onChange={(e) =>
                      onChangeCategory(idx, { dateKey: e.target.value })
                    }
                    className="h-10 px-3 w-full rounded-lg border border-[#E5E7EB] bg-white text-sm font-inter"
                  >
                    <option value="PACK">Pacote completo</option>
                    {ticketDays.map((d) => (
                      <option key={d} value={d}>
                        {formatIsoDateBR(d)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-3 pr-2">
                  <TextInput
                    inputMode="decimal"
                    value={c.price}
                    onChange={(e) =>
                      onChangeCategory(idx, {
                        price: e.target.value.replace(/[^0-9.,]/g, ""),
                      })
                    }
                    placeholder="Ex: 150"
                  />
                </td>
                <td className="py-3 pr-2">
                  <TextInput
                    inputMode="numeric"
                    value={c.quantity}
                    onChange={(e) =>
                      onChangeCategory(idx, {
                        quantity: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="Ex: 50"
                  />
                </td>
                <td className="py-3">
                  {showRemove ? (
                    <button
                      type="button"
                      onClick={() => onRemoveCategory(idx)}
                      className="h-10 px-4 rounded-full border border-[#E6E6E6] text-sm font-semibold font-inter hover:bg-[#F9FAFB]"
                    >
                      Remover
                    </button>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
