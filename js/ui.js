const modalBackdrop = document.getElementById("conversionModalBackdrop");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalCancelBtn = document.getElementById("modalCancelBtn");
const modalConfirmBtn = document.getElementById("modalConfirmBtn");

const modalDocLabel = document.getElementById("modalDocLabel");
const modalFileName = document.getElementById("modalFileName");
const modalCurrentExt = document.getElementById("modalCurrentExt");
const modalTargetExt = document.getElementById("modalTargetExt");
const modalDescription = document.getElementById("conversionModalDescription");
const modalWarningText = document.getElementById("modalWarningText");

const loadingOverlay = document.getElementById("loadingOverlay");
const loadingTitle = document.getElementById("loadingTitle");
const loadingText = document.getElementById("loadingText");

const toastStack = document.getElementById("toastStack");

let activeResolver = null;

function closeModalWithResult(result) {
  if (activeResolver) {
    activeResolver(result);
    activeResolver = null;
  }

  hideConversionModal();
}

export function showConversionModal({
  docLabel,
  fileName,
  currentExtension,
  targetExtension,
}) {
  modalDocLabel.textContent = docLabel || "—";
  modalFileName.textContent = fileName || "—";
  modalCurrentExt.textContent = currentExtension
    ? currentExtension.toUpperCase()
    : "—";
  modalTargetExt.textContent = targetExtension
    ? targetExtension.toUpperCase()
    : "—";

  modalDescription.textContent =
    "O sistema identificou que o arquivo enviado está fora do formato exigido, mas a conversão pode ser feita automaticamente.";
  modalWarningText.textContent = `Deseja converter este arquivo de ${currentExtension.toUpperCase()} para ${targetExtension.toUpperCase()}?`;

  modalBackdrop.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  return new Promise((resolve) => {
    activeResolver = resolve;
  });
}

export function hideConversionModal() {
  modalBackdrop.classList.add("hidden");
  document.body.style.overflow = "";
}

export function showLoading({
  title = "Processando arquivo",
  text = "Aguarde enquanto preparamos tudo para você.",
} = {}) {
  loadingTitle.textContent = title;
  loadingText.textContent = text;
  loadingOverlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

export function hideLoading() {
  loadingOverlay.classList.add("hidden");
  document.body.style.overflow = "";
}

export function showToast({
  title = "Aviso",
  message = "",
  type = "info",
  duration = 3200,
} = {}) {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  toast.innerHTML = `
    <strong class="toast-title">${title}</strong>
    <div class="toast-message">${message}</div>
  `;

  toastStack.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-6px)";
    toast.style.transition = "0.2s ease";

    setTimeout(() => {
      toast.remove();
    }, 200);
  }, duration);
}

export function createConvertButton(docId) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "convert-btn";
  btn.dataset.docId = docId;
  btn.textContent = "Converter arquivo";
  return btn;
}

modalConfirmBtn?.addEventListener("click", () => {
  closeModalWithResult(true);
});

modalCancelBtn?.addEventListener("click", () => {
  closeModalWithResult(false);
});

modalCloseBtn?.addEventListener("click", () => {
  closeModalWithResult(false);
});

modalBackdrop?.addEventListener("click", (event) => {
  if (event.target === modalBackdrop) {
    closeModalWithResult(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalBackdrop.classList.contains("hidden")) {
    closeModalWithResult(false);
  }
});
