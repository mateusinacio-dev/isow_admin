import { COMPLIANCE_DOC_TYPES } from "@/app/api/admin/organizations/utils/compliance";

function normalizeDocType(docType) {
  return String(docType || "")
    .trim()
    .toUpperCase();
}

function isSupportedDocType(docType) {
  const dt = normalizeDocType(docType);
  return Object.values(COMPLIANCE_DOC_TYPES).includes(dt);
}

function extractFirstJsonObject(text) {
  if (!text) {
    return null;
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  const slice = text.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch (e) {
    console.error("Could not parse JSON from AI output", e);
    return null;
  }
}

function toDataUrl(contentType, base64) {
  const safeType = contentType || "image/jpeg";
  return `data:${safeType};base64,${base64}`;
}

const SYSTEM_PROMPT =
  "Você é um assistente especializado em documentos institucionais e certidões brasileiras de ONGs/associações. Sua tarefa é extrair dados estruturados. Responda SOMENTE com JSON válido, sem markdown, sem texto extra. Use datas no formato YYYY-MM-DD. Se não encontrar um campo, use null. Nunca invente dados.";

function buildUserPrompt(docType, contentSuffix) {
  return `Analise este documento do tipo ${docType} de uma associação/ONG brasileira.
Extraia os dados e retorne SOMENTE este JSON:
{
  "expiresAt": "YYYY-MM-DD ou null — data de vencimento/validade",
  "issuedAt": "YYYY-MM-DD ou null — data de emissão do documento",
  "registeredAt": "YYYY-MM-DD ou null — data de registro em cartório (se aplicável)",
  "mandateEndsAt": "YYYY-MM-DD ou null — data fim do mandato da diretoria (só para ata de eleição)",
  "cnpj": "string apenas dígitos ou null — número do CNPJ encontrado no documento",
  "legalName": "string ou null — razão social encontrada no documento",
  "tradeName": "string ou null — nome fantasia encontrado",
  "foundingDate": "YYYY-MM-DD ou null — data de fundação (se constar no documento)",
  "fiscalYear": "número ou null — ano fiscal de referência (só para demonstrações contábeis)",
  "totalRevenue": "número ou null — receita total do exercício (só demonstrações contábeis)",
  "totalExpenses": "número ou null — despesa total do exercício (só demonstrações contábeis)",
  "netResult": "número ou null — resultado líquido (receita - despesa, só demonstrações contábeis)",
  "notes": "string curta ou null — observações relevantes que não se encaixam nos campos acima"
}
Regras por tipo de documento:
- CERTIDÕES (CND_FEDERAL, CERTIDAO_ESTADUAL, CERTIDAO_MUNICIPAL, CRF_FGTS, CNDT): O mais importante é expiresAt (validade) e issuedAt (emissão). Extraia também o CNPJ se visível.
- CNPJ_CARD (Cartão CNPJ): Extraia cnpj, legalName, tradeName, foundingDate e issuedAt. Não tem vencimento.
- ELECTION_MINUTES (Ata de eleição da diretoria): Extraia mandateEndsAt (quando termina o mandato eleito), registeredAt (registro em cartório). Se o documento mencionar um período (ex: '2024-2028'), calcule mandateEndsAt como o último dia do último ano.
- STATUTE (Estatuto): Extraia registeredAt (data de registro em cartório). Sem vencimento.
- CONSTITUTION_MINUTES (Ata de constituição): Extraia registeredAt e foundingDate. Sem vencimento.
- FINANCIAL_STATEMENTS (Demonstrações contábeis): Extraia fiscalYear, totalRevenue, totalExpenses, netResult. Estas informações são usadas para gerar um perfil financeiro da organização.
Se a informação estiver ambígua ou ilegível, use null e explique brevemente em notes.
${contentSuffix}`;
}

// Shared: call Gemini 2.5 Flash with a base64 data URL
async function callGeminiFlash(dataUrl, docType) {
  const userPrompt = buildUserPrompt(docType, "");

  const messages = [
    {
      role: "user",
      content: [
        { type: "text", text: SYSTEM_PROMPT + "\n\n" + userPrompt },
        { type: "image_url", image_url: { url: dataUrl } },
      ],
    },
  ];

  const aiResp = await fetch("/integrations/google-gemini-2-5-flash/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: JSON.stringify(messages) }),
  });

  if (!aiResp.ok) {
    throw new Error(
      `AI extraction failed. Response [${aiResp.status}] ${aiResp.statusText}`,
    );
  }

  const aiJson = await aiResp.json();
  // Handle Gemini response format (candidates) with fallback to OpenAI format (choices)
  return (
    aiJson?.candidates?.[0]?.content?.parts?.[0]?.text ||
    aiJson?.choices?.[0]?.message?.content ||
    ""
  );
}

async function extractFromImage(fileUrl, mimeType, docType) {
  const resp = await fetch(fileUrl);
  if (!resp.ok) {
    throw new Error(
      `Could not fetch fileUrl. Response [${resp.status}] ${resp.statusText}`,
    );
  }

  const contentType = resp.headers.get("content-type") || mimeType || "";
  const arrayBuffer = await resp.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUrl = toDataUrl(contentType, base64);

  return await callGeminiFlash(dataUrl, docType);
}

async function extractFromPdf(fileUrl, docType) {
  // Step 1: Fetch the PDF file as binary
  const pdfResp = await fetch(fileUrl);
  if (!pdfResp.ok) {
    throw new Error(
      `Could not fetch PDF. Response [${pdfResp.status}] ${pdfResp.statusText}`,
    );
  }
  const pdfBuffer = await pdfResp.arrayBuffer();
  const pdfBlob = new Blob([pdfBuffer], { type: "application/pdf" });

  // Step 2: Convert PDF → PNG using File Converter
  const formData = new FormData();
  formData.append("inputFile", pdfBlob, "document.pdf");
  formData.append("outputType", "png");

  const converterResp = await fetch("/integrations/file-converter/convert", {
    method: "POST",
    body: formData,
  });

  if (!converterResp.ok) {
    throw new Error(
      `PDF to image conversion failed. Response [${converterResp.status}] ${converterResp.statusText}`,
    );
  }

  // Step 3: Build base64 data URL from PNG bytes
  const pngBuffer = await converterResp.arrayBuffer();
  const base64 = Buffer.from(pngBuffer).toString("base64");
  const dataUrl = `data:image/png;base64,${base64}`;

  // Step 4: Send to Gemini 2.5 Flash — same path as image extraction
  return await callGeminiFlash(dataUrl, docType);
}

export async function POST(request, { params: { organizationId } }) {
  try {
    const body = await request.json();

    const fileUrl = String(body?.fileUrl || "").trim();
    const mimeType = String(body?.mimeType || "").trim();
    const docType = normalizeDocType(body?.docType);

    if (!organizationId) {
      return Response.json(
        { error: "organizationId is required" },
        { status: 400 },
      );
    }

    if (!fileUrl) {
      return Response.json({ error: "fileUrl is required" }, { status: 400 });
    }

    if (!docType) {
      return Response.json({ error: "docType is required" }, { status: 400 });
    }

    if (!isSupportedDocType(docType)) {
      return Response.json({ error: "Unsupported docType" }, { status: 400 });
    }

    const isImage = mimeType.startsWith("image/");
    const isPdf = mimeType === "application/pdf";

    if (!isImage && !isPdf) {
      return Response.json(
        {
          error:
            "Formato não suportado. Envie uma imagem (PNG/JPG/WEBP) ou um PDF.",
        },
        { status: 400 },
      );
    }

    let content = "";

    if (isPdf) {
      content = await extractFromPdf(fileUrl, docType);
    } else {
      content = await extractFromImage(fileUrl, mimeType, docType);
    }

    const extracted = extractFirstJsonObject(content);

    if (!extracted) {
      return Response.json(
        {
          error:
            "Não consegui ler os dados desse arquivo. Tente enviar uma imagem mais nítida ou um PDF com texto selecionável, ou preencha manualmente.",
          raw: content,
        },
        { status: 422 },
      );
    }

    return Response.json({ extracted });
  } catch (error) {
    console.error(error);
    const message = error?.message || "Could not extract fields from document";
    return Response.json({ error: message }, { status: 500 });
  }
}
