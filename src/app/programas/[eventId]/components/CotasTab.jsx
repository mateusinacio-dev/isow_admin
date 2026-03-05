import { QuotaByTicketTypeTable } from "./QuotaByTicketTypeTable";
import { QuotaByClusterTable } from "./QuotaByClusterTable";

export function CotasTab({ quotaByTicketType, quotaByCluster }) {
  return (
    <>
      <QuotaByTicketTypeTable quotaByTicketType={quotaByTicketType} />

      <QuotaByClusterTable quotaByCluster={quotaByCluster} />

      <div className="text-xs text-[#6B7280] font-inter">
        Nota: se um pedido tiver múltiplos tipos de cota, a atribuição é feita
        pela primeira cota encontrada na compra.
      </div>
    </>
  );
}
