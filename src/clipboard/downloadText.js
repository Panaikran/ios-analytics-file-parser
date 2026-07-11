export function downloadTextFile(
  text,
  filename,
  { BlobCtor = Blob, documentRef = document, urlRef = URL, mimeType = 'text/plain;charset=utf-8' } = {}
) {
  if (!text || !filename) return false;

  const blob = new BlobCtor([text], { type: mimeType });
  const objectUrl = urlRef.createObjectURL(blob);
  const link = documentRef.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.hidden = true;

  try {
    documentRef.body.append(link);
    link.click();
    return true;
  } finally {
    link.remove();
    urlRef.revokeObjectURL(objectUrl);
  }
}
