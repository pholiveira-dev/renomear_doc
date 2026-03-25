function createObjectUrl(file) {
  return URL.createObjectURL(file);
}

function renameFile(file, newName) {
  return new File([file], newName, {
    type: file.type || "application/octet-stream",
    lastModified: Date.now(),
  });
}

export function buildFinalFile(doc, studentName) {
  const effectiveFile = doc.convertedFile || doc.file;

  if (!effectiveFile) return null;

  const extension =
    effectiveFile.name.split(".").pop().toLowerCase() ||
    doc.validation?.targetExtension ||
    "arquivo";

  const finalName = `${studentName}_${doc.label}.${extension}`;

  return renameFile(effectiveFile, finalName);
}

export function createDownloadLink(file, label = "Baixar arquivo") {
  const url = createObjectUrl(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = file.name;
  link.className = "download-link";
  link.textContent = label;

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60000);

  return link;
}

export async function createZipBlob(files, zipName = "documentos.zip") {
  if (!window.JSZip) {
    throw new Error("Biblioteca JSZip não encontrada.");
  }

  const zip = new window.JSZip();

  for (const file of files) {
    zip.file(file.name, file);
  }

  const blob = await zip.generateAsync({ type: "blob" });

  return new File([blob], zipName, {
    type: "application/zip",
    lastModified: Date.now(),
  });
}

export async function createZipDownloadLink(files, zipName = "documentos.zip") {
  const zipFile = await createZipBlob(files, zipName);
  return createDownloadLink(zipFile, "Baixar ZIP");
}
