export function getExtension(fileName) {
  if (!fileName.includes(".")) return "";
  return fileName.split(".").pop().toLowerCase();
}

export function sanitizeName(name) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}
