import { put } from '@vercel/blob';

export async function POST(request) {
    try {
        const contentType = request.headers.get("content-type") || "";

        // 1. Upload de Arquivos via FormData (vindo do browser/useUpload)
        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            const file = formData.get("file");

            if (!file) {
                return Response.json({ error: "No file provided" }, { status: 400 });
            }

            const blob = await put(file.name, file, { access: 'public' });
            return Response.json({ url: blob.url, mimeType: file.type });
        }

        // 2. Upload via JSON (com base64 ou url)
        if (contentType.includes("application/json")) {
            const body = await request.json();

            if (body.base64) {
                const buffer = Buffer.from(body.base64, "base64");
                const blob = await put(`upload-${Date.now()}`, buffer, { access: 'public' });
                return Response.json({ url: blob.url, mimeType: 'application/octet-stream' });
            }

            if (body.url) {
                const res = await fetch(body.url);
                if (!res.ok) throw new Error("Could not fetch URL");

                const arrayBuffer = await res.arrayBuffer();
                const mime = res.headers.get('content-type') || 'application/octet-stream';
                const blob = await put(`upload-${Date.now()}`, Buffer.from(arrayBuffer), { access: 'public', contentType: mime });
                return Response.json({ url: blob.url, mimeType: mime });
            }

            return Response.json({ error: "No valid payload in JSON" }, { status: 400 });
        }

        // 3. Upload raw octet-stream
        const arrayBuffer = await request.arrayBuffer();
        if (arrayBuffer.byteLength > 0) {
            const blob = await put(`upload-${Date.now()}`, Buffer.from(arrayBuffer), { access: 'public' });
            return Response.json({ url: blob.url, mimeType: "application/octet-stream" });
        }

        return Response.json({ error: "Unsupported upload format" }, { status: 400 });
    } catch (error) {
        console.error("Vercel Blob upload error:", error);
        return Response.json({ error: "Upload failed: " + error.message }, { status: 500 });
    }
}
