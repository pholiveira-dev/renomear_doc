import { getExtension } from "./utils.js";

export function validateFile(file, rule) {
  const ext = getExtension(file.name);

  const isValid = rule.acceptedExtensions.includes(ext);
  const canConvert = rule.convertibleFrom.includes(ext);

  return {
    isValid,
    currentExtension: ext,
    acceptedExtensions: rule.acceptedExtensions,
    targetExtension: rule.targetExtension,
    canConvert,
    message: isValid
      ? "Formato válido."
      : `Formato inválido. Enviado: ${ext.toUpperCase()} | Esperado: ${rule.acceptedExtensions.join(", ").toUpperCase()}.`,
  };
}
