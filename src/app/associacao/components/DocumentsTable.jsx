import { useMemo, useState } from "react";

export function DocumentsTable({ documents, onDelete, isPending }) {
  const [showOtherFiles, setShowOtherFiles] = useState(false);

  const { imageDocs, otherDocs } = useMemo(() => {
    const isImage = (d) => {
      const type = String(d?.fileType || "").toLowerCase();
      if (type.startsWith("image/")) {
        return true;
      }
      const url = String(d?.fileUrl || "").toLowerCase();
      return Boolean(url.match(/\.(png|jpg|jpeg|webp|gif)(\?|#|$)/));
    };

    const imgs = [];
    const others = [];

    for (const d of documents || []) {
      if (isImage(d)) {
        imgs.push(d);
      } else {
        others.push(d);
      }
    }

    return { imageDocs: imgs, otherDocs: others };
  }, [documents]);

  const hasAny = Boolean((documents || []).length);
  const hasImages = Boolean(imageDocs.length);
  const hasOthers = Boolean(otherDocs.length);

  const otherFilesToggleLabel = showOtherFiles
    ? "Ocultar outros arquivos"
    : `Ver outros arquivos (${otherDocs.length})`;

  const getExpiresText = (d) => {
    const expires = d?.expiresAt ? String(d.expiresAt).slice(0, 10) : null;
    if (expires) {
      return expires;
    }
    const mandate = d?.meta?.mandateEndsAt
      ? String(d.meta.mandateEndsAt).slice(0, 10)
      : null;
    return mandate || "-";
  };

  return (
    <div className="md:col-span-2">
      <div className="text-sm font-semibold font-inter text-[#111827] mt-4">
        Imagens enviadas
        {hasImages ? (
          <span className="text-xs font-inter text-[#6B7280] font-normal">
            {" "}
            ({imageDocs.length})
          </span>
        ) : null}
      </div>

      {/* Image-focused view */}
      <div className="mt-2">
        {!hasAny ? (
          <div className="text-sm text-[#6B7280] font-inter mt-3">
            Nenhum documento enviado ainda.
          </div>
        ) : null}

        {hasAny && !hasImages ? (
          <div className="text-sm text-[#6B7280] font-inter mt-3">
            Nenhuma imagem encontrada nos arquivos enviados.
          </div>
        ) : null}

        {hasImages ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {imageDocs.map((d) => {
              const desc = d.documentDescription || d.type || "Imagem";
              const expiresText = getExpiresText(d);

              return (
                <div
                  key={d.organizationDocumentId}
                  className="border border-[#E6E6E6] rounded-xl overflow-hidden bg-white"
                >
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                    title="Abrir imagem"
                  >
                    <img
                      src={d.fileUrl}
                      alt={desc}
                      className="w-full h-[120px] object-cover bg-[#F3F4F6]"
                      loading="lazy"
                    />
                  </a>

                  <div className="p-2">
                    <div className="text-[11px] font-inter text-[#111827] font-semibold truncate">
                      {desc}
                    </div>
                    <div className="text-[11px] font-inter text-[#6B7280] mt-0.5">
                      {expiresText}
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-inter text-[#111827] underline"
                      >
                        Abrir
                      </a>
                      <button
                        className="text-[11px] font-inter text-red-700 hover:underline disabled:opacity-60"
                        disabled={isPending}
                        onClick={() => {
                          const ok = window.confirm("Remover este documento?");
                          if (!ok) {
                            return;
                          }
                          onDelete(d.organizationDocumentId);
                        }}
                        type="button"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Optional: other files (PDF etc) */}
      {hasOthers ? (
        <div className="mt-5">
          <button
            type="button"
            className="text-sm font-inter text-[#111827] underline"
            onClick={() => setShowOtherFiles((v) => !v)}
          >
            {otherFilesToggleLabel}
          </button>

          {showOtherFiles ? (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm font-inter">
                <thead>
                  <tr className="text-xs text-[#6B7280]">
                    <th className="text-left py-2">Tipo</th>
                    <th className="text-left py-2">Descrição</th>
                    <th className="text-left py-2">Vencimento</th>
                    <th className="text-left py-2">Arquivo</th>
                    <th className="text-right py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {otherDocs.map((d) => {
                    const expiresText = getExpiresText(d);
                    return (
                      <tr key={d.organizationDocumentId} className="border-t">
                        <td className="py-2">{d.type}</td>
                        <td className="py-2">{d.documentDescription}</td>
                        <td className="py-2">{expiresText}</td>
                        <td className="py-2">
                          {d.fileUrl ? (
                            <a
                              href={d.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-black underline"
                            >
                              Abrir
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-2 text-right">
                          <button
                            className="text-red-700 hover:underline disabled:opacity-60"
                            disabled={isPending}
                            onClick={() => {
                              const ok = window.confirm(
                                "Remover este documento?",
                              );
                              if (!ok) {
                                return;
                              }
                              onDelete(d.organizationDocumentId);
                            }}
                            type="button"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
