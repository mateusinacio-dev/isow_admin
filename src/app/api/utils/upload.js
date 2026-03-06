import { put } from '@vercel/blob';

async function upload({
  url,
  buffer,
  base64
}) {
  let fileData;
  let contentType = 'application/octet-stream';

  if (buffer) {
    fileData = buffer;
  } else if (base64) {
    fileData = Buffer.from(base64, "base64");
  } else if (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not fetch URL");
    fileData = Buffer.from(await res.arrayBuffer());
    contentType = res.headers.get("content-type") || contentType;
  } else {
    throw new Error("No data provided");
  }

  const blob = await put(`upload-${Date.now()}`, fileData, { access: 'public', contentType, addRandomSuffix: true });

  return {
    url: blob.url,
    mimeType: contentType
  };
}

export { upload };
export default upload;