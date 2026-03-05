export function DocumentUploadForm({
  docForm,
  setDocForm,
  docTypeOptions,
  docFile,
  setDocFile,
  onExtract,
  extracting,
  onSubmit,
  isPending,
  uploading,
  docRequirements,
  fieldErrors,
  showValidation,
  // NEW (optional): allow using this form inside a popup and lock the doc type
  title,
  showHeader = true,
  showDocTypeSelect = true,
  lockedDocTypeLabel,
  // NEW: controls whether extra fields are revealed
  fieldsRevealed = true,
  aiMessage = null,
  aiMessageType = "info", // "info" | "error"
}) {
  const baseClass = "mt-1 w-full h-10 px-3 rounded-lg border";

  const requiresExpiresAt = Boolean(docRequirements?.requiresExpiresAt);
  const requiresMandateEndsAt = Boolean(docRequirements?.requiresMandateEndsAt);
  const requiresFiscalYear = Boolean(docRequirements?.requiresFiscalYear);
  const requiresCnpj = Boolean(docRequirements?.requiresCnpj);

  const showExpiresAt = Boolean(docRequirements?.showExpiresAt);
  const showMandateEndsAt = Boolean(docRequirements?.showMandateEndsAt);
  const showFiscalYear = Boolean(docRequirements?.showFiscalYear);
  const showCnpj = Boolean(docRequirements?.showCnpj);

  const expiresAtLabel = requiresExpiresAt
    ? "Data de vencimento *"
    : "Data de vencimento";

  const mandateLabel = requiresMandateEndsAt
    ? "Vencimento do mandato (ata eleição) *"
    : "Vencimento do mandato (ata eleição)";

  const fiscalYearLabel = requiresFiscalYear
    ? "Ano fiscal (demonstração) *"
    : "Ano fiscal (demonstração)";

  const cnpjLabel = requiresCnpj ? "CNPJ (cartão) *" : "CNPJ (cartão)";

  const hint = docRequirements?.hint || null;
  const showHint = Boolean(hint);

  const submitReady = Boolean(docFile && docForm.docType && fieldsRevealed);

  const submitDisabled = isPending || uploading || extracting || !submitReady;

  const submitClassBase =
    "h-10 px-4 rounded-lg bg-black text-white text-sm font-inter hover:bg-black/90 disabled:opacity-60";
  const submitClass = submitReady
    ? submitClassBase
    : `${submitClassBase} opacity-60`;

  const docTypeError = showValidation ? fieldErrors?.docType : null;
  const expiresAtError = showValidation ? fieldErrors?.expiresAt : null;
  const mandateEndsAtError = showValidation ? fieldErrors?.mandateEndsAt : null;
  const fiscalYearError = showValidation ? fieldErrors?.fiscalYear : null;
  const cnpjError = showValidation ? fieldErrors?.cnpj : null;

  const docTypeClass = `${baseClass} ${
    docTypeError ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const descriptionClass = `${baseClass} border-[#E6E6E6]`;

  const registeredAtClass = `${baseClass} border-[#E6E6E6]`;
  const issuedAtClass = `${baseClass} border-[#E6E6E6]`;

  const expiresAtClass = `${baseClass} ${
    expiresAtError ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const mandateEndsAtClass = `${baseClass} ${
    mandateEndsAtError ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const fiscalYearClass = `${baseClass} ${
    fiscalYearError ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const cnpjClass = `${baseClass} ${
    cnpjError ? "border-red-400" : "border-[#E6E6E6]"
  }`;

  const headerTitle = title || "Enviar novo documento";

  // Determine if there are any extra fields to show for this doc type
  const hasExtraFields =
    showExpiresAt || showMandateEndsAt || showFiscalYear || showCnpj;

  return (
    <>
      {showHeader ? (
        <div className="md:col-span-2">
          <div className="text-sm font-semibold font-inter text-[#111827] mt-2">
            {headerTitle}
          </div>
        </div>
      ) : null}

      {showHint && fieldsRevealed ? (
        <div className="md:col-span-2 bg-[#F9FAFB] border border-[#E6E6E6] rounded-lg p-3 text-xs font-inter text-[#374151]">
          {hint}
        </div>
      ) : null}

      {showDocTypeSelect ? (
        <label className="text-sm font-inter">
          <div className="text-xs text-[#6B7280]">Tipo *</div>
          <select
            className={docTypeClass}
            value={docForm.docType}
            required
            onChange={(e) =>
              setDocForm((p) => ({
                ...p,
                docType: e.target.value,
                description:
                  p.description ||
                  docTypeOptions.find((o) => o.value === e.target.value)
                    ?.label ||
                  "",
              }))
            }
          >
            <option value="">Selecione…</option>
            {docTypeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {docTypeError ? (
            <div className="text-[11px] font-inter text-red-600 mt-1">
              {docTypeError}
            </div>
          ) : null}
        </label>
      ) : (
        <div className="text-sm font-inter">
          <div className="text-xs text-[#6B7280]">Tipo</div>
          <div className="mt-1 w-full h-10 px-3 rounded-lg border border-[#E6E6E6] bg-[#F9FAFB] flex items-center">
            <div className="text-sm text-[#111827] truncate">
              {lockedDocTypeLabel || docForm.docType || "-"}
            </div>
          </div>
        </div>
      )}

      {/* Descrição always visible */}
      <label className="text-sm font-inter">
        <div className="text-xs text-[#6B7280]">Descrição</div>
        <input
          className={descriptionClass}
          value={docForm.description}
          onChange={(e) =>
            setDocForm((p) => ({ ...p, description: e.target.value }))
          }
        />
      </label>

      {/* File input — always visible */}
      <div className="md:col-span-2">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="block"
          onChange={(e) => setDocFile(e.target.files?.[0] || null)}
        />
      </div>

      {/* Loading indicator while extracting */}
      {extracting ? (
        <div className="md:col-span-2 flex items-center gap-3 bg-[#F9FAFB] border border-[#E6E6E6] rounded-lg p-4">
          <svg
            className="animate-spin h-5 w-5 text-[#6B7280]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm font-inter text-[#374151]">
            Lendo documento com IA…
          </span>
        </div>
      ) : null}

      {/* AI message (success or error) */}
      {!extracting && aiMessage ? (
        <div
          className={`md:col-span-2 rounded-lg p-3 text-xs font-inter ${
            aiMessageType === "error"
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-green-50 border border-green-200 text-green-700"
          }`}
        >
          {aiMessage}
        </div>
      ) : null}

      {/* Extra fields — only shown when fieldsRevealed is true AND not extracting */}
      {fieldsRevealed && !extracting ? (
        <>
          <label className="text-sm font-inter">
            <div className="text-xs text-[#6B7280]">
              Data de registro (cartório)
            </div>
            <input
              type="date"
              lang="pt-BR"
              className={registeredAtClass}
              value={docForm.registeredAt}
              onChange={(e) =>
                setDocForm((p) => ({ ...p, registeredAt: e.target.value }))
              }
            />
          </label>

          <label className="text-sm font-inter">
            <div className="text-xs text-[#6B7280]">Data de emissão</div>
            <input
              type="date"
              lang="pt-BR"
              className={issuedAtClass}
              value={docForm.issuedAt}
              onChange={(e) =>
                setDocForm((p) => ({ ...p, issuedAt: e.target.value }))
              }
            />
          </label>

          {showExpiresAt ? (
            <label className="text-sm font-inter">
              <div className="text-xs text-[#6B7280]">{expiresAtLabel}</div>
              <input
                type="date"
                lang="pt-BR"
                className={expiresAtClass}
                value={docForm.expiresAt}
                required={requiresExpiresAt}
                onChange={(e) =>
                  setDocForm((p) => ({ ...p, expiresAt: e.target.value }))
                }
              />
              {expiresAtError ? (
                <div className="text-[11px] font-inter text-red-600 mt-1">
                  {expiresAtError}
                </div>
              ) : null}
            </label>
          ) : null}

          {showMandateEndsAt ? (
            <label className="text-sm font-inter">
              <div className="text-xs text-[#6B7280]">{mandateLabel}</div>
              <input
                type="date"
                lang="pt-BR"
                className={mandateEndsAtClass}
                value={docForm.mandateEndsAt}
                required={requiresMandateEndsAt}
                onChange={(e) =>
                  setDocForm((p) => ({ ...p, mandateEndsAt: e.target.value }))
                }
              />
              {mandateEndsAtError ? (
                <div className="text-[11px] font-inter text-red-600 mt-1">
                  {mandateEndsAtError}
                </div>
              ) : null}
            </label>
          ) : null}

          {showFiscalYear ? (
            <label className="text-sm font-inter">
              <div className="text-xs text-[#6B7280]">{fiscalYearLabel}</div>
              <input
                type="number"
                inputMode="numeric"
                className={fiscalYearClass}
                value={docForm.fiscalYear}
                required={requiresFiscalYear}
                onChange={(e) =>
                  setDocForm((p) => ({ ...p, fiscalYear: e.target.value }))
                }
              />
              {fiscalYearError ? (
                <div className="text-[11px] font-inter text-red-600 mt-1">
                  {fiscalYearError}
                </div>
              ) : null}
            </label>
          ) : null}

          {showCnpj ? (
            <label className="text-sm font-inter">
              <div className="text-xs text-[#6B7280]">{cnpjLabel}</div>
              <input
                className={cnpjClass}
                value={docForm.cnpj}
                required={requiresCnpj}
                onChange={(e) =>
                  setDocForm((p) => ({ ...p, cnpj: e.target.value }))
                }
              />
              {cnpjError ? (
                <div className="text-[11px] font-inter text-red-600 mt-1">
                  {cnpjError}
                </div>
              ) : null}
            </label>
          ) : null}
        </>
      ) : null}

      {/* Submit button */}
      <div className="md:col-span-2">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <button
            className={submitClass}
            disabled={submitDisabled}
            onClick={onSubmit}
            type="button"
          >
            {isPending ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </div>
    </>
  );
}
