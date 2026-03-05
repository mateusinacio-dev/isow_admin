import { formatDocStatus, statusPillClass } from "../utils/formatters";

export function StatusPill({ status, pending }) {
  if (pending !== undefined) {
    return pending ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full border text-xs font-inter bg-red-50 text-red-800 border-red-200">
        Pendência documental
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full border text-xs font-inter bg-emerald-50 text-emerald-800 border-emerald-200">
        Documentos OK
      </span>
    );
  }

  return (
    <div
      className={`flex-shrink-0 px-2 py-1 rounded-full border text-[11px] font-inter ${statusPillClass(status)}`}
    >
      {formatDocStatus(status)}
    </div>
  );
}
