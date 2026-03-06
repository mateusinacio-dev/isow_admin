import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import useUpload from "@/utils/useUpload";
import { ComplianceStatusGrid } from "./ComplianceStatusGrid";
import { DocumentUploadForm } from "./DocumentUploadForm";
import { DocumentsTable } from "./DocumentsTable";
import { StatusPill } from "./StatusPill";
import { isoFromDateInput } from "../utils/formatters";
import {
  getComplianceDocRequirements,
  validateComplianceDocForm,
} from "../utils/validation";

function toDateInputValue(value) {
  if (!value) {
    return "";
  }
  const s = String(value);
  const match = s.match(/\d{4}-\d{2}-\d{2}/);
  if (match) {
    return match[0];
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return d.toISOString().slice(0, 10);
}

// Fields that the AI can fill and the user might manually edit
const AI_FILLABLE_FIELDS = [
  "expiresAt",
  "issuedAt",
  "registeredAt",
  "mandateEndsAt",
  "fiscalYear",
  "cnpj",
];

export function ComplianceSection({
  organizationId,
  complianceSummary,
  documents,
  docsMutation,
  deleteDocMutation,
  setError,
  setSuccess,
}) {
  const [upload, { loading: uploading }] = useUpload();
  const [extracting, setExtracting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const [showDocValidation, setShowDocValidation] = useState(false);

  const [docPopupOpen, setDocPopupOpen] = useState(false);
  const [activeComplianceItem, setActiveComplianceItem] = useState(null);

  // Whether the extra fields (dates, cnpj, fiscal year, mandate) are revealed
  const [fieldsRevealed, setFieldsRevealed] = useState(false);

  // AI feedback message shown in the form
  const [aiMessage, setAiMessage] = useState(null);
  const [aiMessageType, setAiMessageType] = useState("info");

  // Track which fields were set by AI (their AI-provided values)
  // so we can detect manual edits
  const aiValuesRef = useRef({});

  // Track which fields the user has manually edited (changed away from AI value)
  const manuallyEditedRef = useRef(new Set());

  const [docForm, setDocForm] = useState({
    docType: "",
    description: "",
    expiresAt: "",
    issuedAt: "",
    registeredAt: "",
    mandateEndsAt: "",
    fiscalYear: "",
    cnpj: "",
  });
  const [docFile, setDocFile] = useState(null);

  const [extractedMeta, setExtractedMeta] = useState(null);

  const complianceItems = complianceSummary?.items || [];

  const docTypeOptions = useMemo(() => {
    return complianceItems.map((i) => ({ value: i.type, label: i.label }));
  }, [complianceItems]);

  const docRequirements = useMemo(() => {
    return getComplianceDocRequirements(docForm.docType);
  }, [docForm.docType]);

  const docValidation = useMemo(() => {
    return validateComplianceDocForm(docForm);
  }, [docForm]);

  useEffect(() => {
    if (!docPopupOpen) {
      return;
    }
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setDocPopupOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [docPopupOpen]);

  const missingDocLabels = useMemo(() => {
    return complianceItems
      .filter((i) => i.status === "MISSING")
      .map((i) => i.label);
  }, [complianceItems]);

  const expiredDocLabels = useMemo(() => {
    return complianceItems
      .filter((i) => i.status === "EXPIRED")
      .map((i) => i.label);
  }, [complianceItems]);

  const showComplianceBanner =
    missingDocLabels.length > 0 || expiredDocLabels.length > 0;

  const complianceBannerText = useMemo(() => {
    const parts = [];
    if (missingDocLabels.length) {
      parts.push(`Faltando: ${missingDocLabels.join(", ")}`);
    }
    if (expiredDocLabels.length) {
      parts.push(`Vencidos: ${expiredDocLabels.join(", ")}`);
    }
    return parts.join(" · ");
  }, [expiredDocLabels, missingDocLabels]);

  const ensureUploaded = async (fileOverride) => {
    const targetFile = fileOverride || docFile;

    // Se há um cache do upload atual, reutilize
    if (uploadedFile?.url && !fileOverride) {
      return uploadedFile;
    }
    // Sem novo arquivo: reutiliza o documento existente (só atualiza metadados)
    if (!targetFile) {
      const existingUrl = activeComplianceItem?.fileUrl;
      if (existingUrl) {
        const ext = existingUrl.split('?')[0].split('.').pop().toLowerCase();
        const mimeByExt = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
        return { url: existingUrl, mimeType: mimeByExt[ext] || 'application/octet-stream' };
      }
      return null;
    }
    const uploaded = await upload({ file: targetFile, name: docForm.docType || undefined });
    if (uploaded?.error) {
      setError(uploaded.error);
      return null;
    }
    const next = { url: uploaded.url, mimeType: uploaded.mimeType };
    setUploadedFile(next);
    return next;
  };

  // Wrapped setDocForm that also detects manual edits
  const handleSetDocForm = useCallback((updater) => {
    setDocForm((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;

      // Check if any AI-fillable field changed from its AI value
      for (const field of AI_FILLABLE_FIELDS) {
        const aiVal = aiValuesRef.current[field];
        if (aiVal !== undefined && next[field] !== aiVal) {
          manuallyEditedRef.current.add(field);
        }
      }

      return next;
    });
  }, []);

  const runExtraction = useCallback(
    async (file) => {
      setError(null);
      setSuccess(null);
      setAiMessage(null);

      if (!file || !docForm.docType) {
        return;
      }

      // Upload the file first
      const uploaded = await ensureUploaded(file);
      if (!uploaded) {
        // Upload failed — reveal fields for manual entry
        setFieldsRevealed(true);
        setAiMessage(
          "Não foi possível enviar o arquivo. Preencha os campos manualmente.",
        );
        setAiMessageType("error");
        return;
      }

      const isImage =
        uploaded.mimeType && uploaded.mimeType.startsWith("image/");
      const isPdf = uploaded.mimeType === "application/pdf";

      if (!isImage && !isPdf) {
        setFieldsRevealed(true);
        setAiMessage(
          "Formato não suportado para leitura automática. Preencha os campos manualmente.",
        );
        setAiMessageType("error");
        return;
      }

      setExtracting(true);
      try {
        const response = await fetch(
          `/api/admin/organizations/${organizationId}/compliance/extract`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileUrl: uploaded.url,
              mimeType: uploaded.mimeType,
              docType: docForm.docType,
            }),
          },
        );

        if (!response.ok) {
          const msg = `Quando lendo o documento por IA, a resposta foi [${response.status}] ${response.statusText}`;
          throw new Error(msg);
        }

        const data = await response.json();
        const extracted = data?.extracted || {};

        // Build the new AI values
        const newAiValues = {
          expiresAt: toDateInputValue(extracted.expiresAt),
          issuedAt: toDateInputValue(extracted.issuedAt),
          registeredAt: toDateInputValue(extracted.registeredAt),
          mandateEndsAt: toDateInputValue(extracted.mandateEndsAt),
          fiscalYear: extracted.fiscalYear ? String(extracted.fiscalYear) : "",
          cnpj: extracted.cnpj ? String(extracted.cnpj) : "",
        };

        // Store AI values for manual-edit detection
        aiValuesRef.current = { ...newAiValues };

        // Only fill fields that the user has NOT manually edited
        setDocForm((prev) => {
          const next = { ...prev };
          for (const field of AI_FILLABLE_FIELDS) {
            if (!manuallyEditedRef.current.has(field)) {
              next[field] = newAiValues[field] || prev[field];
            }
          }
          return next;
        });

        // Store extra meta
        const extraMeta = {};
        if (extracted.legalName) extraMeta.legalName = extracted.legalName;
        if (extracted.tradeName) extraMeta.tradeName = extracted.tradeName;
        if (extracted.foundingDate)
          extraMeta.foundingDate = extracted.foundingDate;
        if (extracted.totalRevenue != null)
          extraMeta.totalRevenue = extracted.totalRevenue;
        if (extracted.totalExpenses != null)
          extraMeta.totalExpenses = extracted.totalExpenses;
        if (extracted.netResult != null)
          extraMeta.netResult = extracted.netResult;
        if (extracted.notes) extraMeta.notes = extracted.notes;
        setExtractedMeta(Object.keys(extraMeta).length > 0 ? extraMeta : null);

        setFieldsRevealed(true);
        setAiMessage("Dados preenchidos por IA. Confira e clique Enviar.");
        setAiMessageType("info");
      } catch (e) {
        console.error(e);
        // On failure, reveal fields empty so user can fill manually
        setFieldsRevealed(true);
        setAiMessage(
          "Não foi possível ler o documento automaticamente. Preencha os campos manualmente.",
        );
        setAiMessageType("error");
      } finally {
        setExtracting(false);
      }
    },
    [docForm.docType, organizationId],
  );

  const handleFileChange = (file) => {
    setDocFile(file);
    setUploadedFile(null);

    if (!file) {
      // User cleared the file — hide fields, reset state
      setFieldsRevealed(false);
      setAiMessage(null);
      setAiMessageType("info");
      return;
    }

    // Automatically trigger extraction
    runExtraction(file);
  };

  const handleDocumentSubmit = async () => {
    setError(null);
    setSuccess(null);
    setShowDocValidation(true);

    const hasExisting = Boolean(activeComplianceItem?.fileUrl);
    if (!docForm.docType) {
      setError("Selecione o tipo do documento.");
      return;
    }
    if (!docFile && !hasExisting) {
      setError("Selecione o arquivo do documento.");
      return;
    }

    const nextValidation = validateComplianceDocForm(docForm);
    if (!nextValidation.isValid) {
      setError(nextValidation.issues.join(" "));
      return;
    }

    const uploaded = await ensureUploaded();
    if (!uploaded) {
      return;
    }

    const meta = {};
    if (docForm.mandateEndsAt) {
      meta.mandateEndsAt = isoFromDateInput(docForm.mandateEndsAt);
    }
    if (docForm.fiscalYear) {
      meta.year = Number(docForm.fiscalYear);
    }
    if (docForm.cnpj) {
      meta.cnpj = docForm.cnpj;
    }

    if (extractedMeta) {
      Object.assign(meta, extractedMeta);
    }

    const payload = {
      docType: docForm.docType,
      description: docForm.description,
      fileUrl: uploaded.url,
      mimeType: uploaded.mimeType,
      registeredAt: isoFromDateInput(docForm.registeredAt),
      issuedAt: isoFromDateInput(docForm.issuedAt),
      expiresAt: isoFromDateInput(docForm.expiresAt),
      meta,
    };

    docsMutation.mutate({ payload });

    setDocFile(null);
    setUploadedFile(null);
    setShowDocValidation(false);
    setExtractedMeta(null);
    setFieldsRevealed(false);
    setAiMessage(null);
    setAiMessageType("info");
    aiValuesRef.current = {};
    manuallyEditedRef.current = new Set();
    setDocForm((p) => ({
      ...p,
      expiresAt: "",
      issuedAt: "",
      registeredAt: "",
      mandateEndsAt: "",
      fiscalYear: "",
      cnpj: "",
    }));
  };

  const openDocPopup = (item) => {
    setError(null);
    setSuccess(null);
    setShowDocValidation(false);
    setDocFile(null);
    setUploadedFile(null);
    setExtractedMeta(null);
    setAiMessage(null);
    setAiMessageType("info");
    aiValuesRef.current = {};
    manuallyEditedRef.current = new Set();

    setActiveComplianceItem(item || null);

    // Se já existe documento enviado, pré-preencher campos com dados existentes
    const hasExisting = Boolean(item?.fileUrl);
    setFieldsRevealed(hasExisting);

    const meta = item?.meta || {};
    setDocForm((p) => ({
      ...p,
      docType: item?.type || "",
      description: item?.label || p.description,
      expiresAt: item?.expiresAt || "",
      issuedAt: item?.issuedAt || "",
      registeredAt: item?.registeredAt || "",
      mandateEndsAt: meta.mandateEndsAt ? String(meta.mandateEndsAt).slice(0, 10) : "",
      fiscalYear: meta.year ? String(meta.year) : "",
      cnpj: meta.cnpj || "",
    }));

    setDocPopupOpen(true);
  };

  const closeDocPopup = () => {
    if (docsMutation.isPending || uploading || extracting) {
      return;
    }
    setDocPopupOpen(false);
  };

  return (
    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
      {showComplianceBanner ? (
        <div className="md:col-span-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-sm font-semibold font-inter text-red-800">
            Documentos obrigatórios pendentes
          </div>
          <div className="text-xs font-inter text-red-700 mt-1">
            {complianceBannerText}
          </div>
        </div>
      ) : null}

      <ComplianceStatusGrid
        complianceItems={complianceItems}
        onItemClick={openDocPopup}
      />

      <DocumentsTable
        documents={documents}
        onDelete={(organizationDocumentId) =>
          deleteDocMutation.mutate({ organizationDocumentId })
        }
        isPending={deleteDocMutation.isPending}
      />

      {docPopupOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={closeDocPopup}
            aria-label="Fechar"
          />

          <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-[#E6E6E6] shadow-xl p-4 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-semibold font-inter text-[#111827] truncate">
                  {activeComplianceItem?.label || "Documento"}
                </div>
                <div className="text-xs font-inter text-[#6B7280] mt-1">
                  Selecione o arquivo para leitura automática por IA.
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div title={(activeComplianceItem?.warnings || []).join("\n")}>
                  <StatusPill status={activeComplianceItem?.status || "OK"} />
                </div>
                <button
                  type="button"
                  className="h-10 px-3 rounded-lg border border-[#E6E6E6] text-sm font-inter hover:bg-[#F9FAFB] disabled:opacity-60"
                  onClick={closeDocPopup}
                  disabled={docsMutation.isPending || uploading || extracting}
                >
                  Fechar
                </button>
              </div>
            </div>

            {activeComplianceItem?.fileUrl ? (
              <div className="mt-3 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <svg className="shrink-0 mt-0.5 h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold font-inter text-blue-800">
                    Arquivo já enviado
                  </div>
                  <div className="text-xs font-inter text-blue-700 mt-0.5">
                    Os campos abaixo foram preenchidos com os dados do envio anterior.{" "}
                    <a
                      href={activeComplianceItem.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-medium"
                    >
                      Ver arquivo atual
                    </a>
                  </div>
                  <div className="text-[11px] font-inter text-blue-600 mt-1">
                    Para atualizar, escolha um novo arquivo — os campos serão preenchidos automaticamente pela IA.
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <DocumentUploadForm
                title={null}
                showHeader={false}
                showDocTypeSelect={false}
                lockedDocTypeLabel={activeComplianceItem?.label}
                docForm={docForm}
                setDocForm={handleSetDocForm}
                docTypeOptions={docTypeOptions}
                docFile={docFile}
                setDocFile={handleFileChange}
                onExtract={runExtraction}
                extracting={extracting}
                onSubmit={handleDocumentSubmit}
                isPending={docsMutation.isPending}
                uploading={uploading}
                docRequirements={docRequirements}
                fieldErrors={docValidation.fieldErrors}
                showValidation={showDocValidation}
                fieldsRevealed={fieldsRevealed}
                aiMessage={aiMessage}
                aiMessageType={aiMessageType}
                hasExistingFile={Boolean(activeComplianceItem?.fileUrl)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
