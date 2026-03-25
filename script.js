import { documents } from "./js/config.js";
import { createInitialState } from "./js/state.js";
import { sanitizeName } from "./js/utils.js";
import { validateFile } from "./js/validators.js";
import { convertFile } from "./js/converters.js";
import {
  buildFinalFile,
  createDownloadLink,
  createZipDownloadLink,
} from "./js/downloads.js";
import {
  showConversionModal,
  showLoading,
  hideLoading,
  showToast,
  createConvertButton,
} from "./js/ui.js";

const documentGrid = document.getElementById("documentGrid");
const resultList = document.getElementById("resultList");
const zipArea = document.getElementById("zipArea");
const processBtn = document.getElementById("processBtn");
const clearBtn = document.getElementById("clearBtn");
const studentNameInput = document.getElementById("studentName");
const selectedCount = document.getElementById("selectedCount");
const docCount = document.getElementById("docCount");
const themeToggle = document.getElementById("themeToggle");

const documentState = createInitialState(documents);

docCount.textContent = documents.length;

function getDocState(docId) {
  return documentState.find((doc) => doc.id === docId);
}

function refreshSelectedCount() {
  const total = documentState.filter((doc) => doc.file).length;
  selectedCount.textContent = total;
}

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  themeToggle.textContent = theme === "dark" ? "Modo claro" : "Modo escuro";
}

function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  const preferredDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;

  const theme = savedTheme || (preferredDark ? "dark" : "light");
  applyTheme(theme);
}

function isImageLike(file) {
  return file && file.type && file.type.startsWith("image/");
}

function createPreviewUrl(file) {
  if (!isImageLike(file)) return null;
  return URL.createObjectURL(file);
}

function getStatusMeta(state) {
  const status = state?.status || "empty";

  const map = {
    empty: {
      badge: "Aguardando",
      tone: "neutral",
      summary: "Nenhum arquivo enviado ainda.",
      progress: 0,
    },
    valid: {
      badge: "Válido",
      tone: "success",
      summary: "Arquivo dentro do formato exigido.",
      progress: 100,
    },
    convertible: {
      badge: "Conversível",
      tone: "warning",
      summary: "Formato fora do padrão, mas com conversão disponível.",
      progress: 68,
    },
    converted: {
      badge: "Convertido",
      tone: "info",
      summary: "Arquivo convertido e pronto para a etapa final.",
      progress: 100,
    },
    invalid: {
      badge: "Inválido",
      tone: "danger",
      summary: "Arquivo fora do padrão exigido e sem conversão disponível.",
      progress: 32,
    },
    error: {
      badge: "Erro",
      tone: "danger",
      summary: "Houve um problema ao processar este documento.",
      progress: 24,
    },
  };

  return map[status] || map.empty;
}

function clearPreview(previewBox) {
  previewBox.innerHTML = `
    <div class="preview-placeholder">
      <span class="preview-placeholder-icon">⌁</span>
      <span class="preview-placeholder-text">Sem pré-visualização</span>
    </div>
  `;
}

function renderPreview(previewBox, file) {
  if (!file) {
    clearPreview(previewBox);
    return;
  }

  if (!isImageLike(file)) {
    previewBox.innerHTML = `
      <div class="preview-file">
        <span class="preview-file-icon">📄</span>
        <div class="preview-file-meta">
          <strong>${file.name}</strong>
          <span>Prévia indisponível para este formato</span>
        </div>
      </div>
    `;
    return;
  }

  const url = createPreviewUrl(file);

  previewBox.innerHTML = `
    <div class="preview-image-wrap">
      <img class="preview-image" src="${url}" alt="Pré-visualização do arquivo" />
    </div>
  `;

  const img = previewBox.querySelector(".preview-image");
  img.addEventListener(
    "load",
    () => {
      URL.revokeObjectURL(url);
    },
    { once: true },
  );
}

function buildResultItem({ label, originalName, finalName, message, file }) {
  const item = document.createElement("div");
  item.className = "result-item premium-result-item";

  item.innerHTML = `
    <div class="result-header">
      <div class="result-badge">Pronto</div>
      <strong>${label}</strong>
    </div>
    <div class="old-name">Arquivo base: ${originalName}</div>
    <div class="new-name">Novo nome: ${finalName}</div>
    <div class="old-name">${message}</div>
  `;

  if (file) {
    const downloadLink = createDownloadLink(file, "Baixar arquivo");
    item.appendChild(downloadLink);
  }

  return item;
}

function createDocumentCards() {
  documentGrid.innerHTML = "";

  documents.forEach((doc) => {
    const card = document.createElement("div");
    card.className = "doc-card premium-doc-card";
    card.dataset.docId = doc.id;
    card.dataset.state = "empty";

    card.innerHTML = `
      <div class="doc-card-glow"></div>

      <div class="doc-card-head">
        <div class="doc-title-wrap">
          <h3>${doc.label}</h3>
          <small class="doc-rule-line">
            Formatos aceitos: ${doc.acceptedExtensions.map((ext) => ext.toUpperCase()).join(", ")}
          </small>
        </div>

        <div class="doc-status-badge tone-neutral" id="badge_${doc.id}">
          Aguardando
        </div>
      </div>

      <div class="doc-progress-shell">
        <div class="doc-progress-bar" id="progress_${doc.id}" style="width: 0%"></div>
      </div>

      <div class="doc-preview" id="preview_${doc.id}">
        <div class="preview-placeholder">
          <span class="preview-placeholder-icon">⌁</span>
          <span class="preview-placeholder-text">Sem pré-visualização</span>
        </div>
      </div>

      <label class="dropzone premium-dropzone" for="${doc.id}" id="drop_${doc.id}">
        <div class="dropzone-inner">
          <span class="dropzone-title">Adicionar documento</span>
          <span class="dropzone-subtitle">Clique para selecionar ou arraste o arquivo aqui</span>
        </div>
      </label>

      <input
        class="file-input"
        type="file"
        id="${doc.id}"
      />

      <div class="file-status premium-file-status" id="status_${doc.id}">
        Nenhum arquivo selecionado.
      </div>

      <div class="doc-summary-line" id="summary_${doc.id}">
        Nenhum arquivo enviado ainda.
      </div>

      <div class="status-actions" id="actions_${doc.id}"></div>

      <div class="file-actions">
        <button type="button" class="remove-file-btn" id="remove_${doc.id}">
          Excluir arquivo
        </button>
      </div>
    `;

    documentGrid.appendChild(card);

    const input = card.querySelector(".file-input");
    const status = card.querySelector(".file-status");
    const dropzone = card.querySelector(".dropzone");
    const removeBtn = card.querySelector(".remove-file-btn");
    const actionsArea = card.querySelector(`#actions_${doc.id}`);
    const badge = card.querySelector(`#badge_${doc.id}`);
    const progressBar = card.querySelector(`#progress_${doc.id}`);
    const summary = card.querySelector(`#summary_${doc.id}`);
    const previewBox = card.querySelector(`#preview_${doc.id}`);

    function applyCardTone(tone) {
      card.dataset.state = tone;
      badge.className = `doc-status-badge tone-${tone}`;
    }

    function renderDocStatus() {
      const currentState = getDocState(doc.id);
      const meta = getStatusMeta(currentState);

      actionsArea.innerHTML = "";
      badge.textContent = meta.badge;
      summary.textContent = meta.summary;
      progressBar.style.width = `${meta.progress}%`;
      applyCardTone(meta.tone);

      if (!currentState || !currentState.file) {
        status.className = "file-status premium-file-status warn";
        status.textContent = "Nenhum arquivo selecionado.";
        removeBtn.classList.remove("show");
        clearPreview(previewBox);
        refreshSelectedCount();
        return;
      }

      removeBtn.classList.add("show");

      const displayFile = currentState.convertedFile || currentState.file;
      renderPreview(previewBox, displayFile);

      if (currentState.status === "valid") {
        status.className = "file-status premium-file-status ok";
        status.textContent = `Arquivo válido: ${currentState.file.name}`;
      } else if (currentState.status === "convertible") {
        status.className = "file-status premium-file-status warn";
        status.textContent = `${currentState.validation.message} Conversão disponível para ${currentState.validation.targetExtension.toUpperCase()}.`;

        const convertBtn = createConvertButton(doc.id);
        convertBtn.classList.add("premium-convert-btn");

        convertBtn.addEventListener("click", async () => {
          const confirmed = await showConversionModal({
            docLabel: currentState.label,
            fileName: currentState.file.name,
            currentExtension: currentState.validation.currentExtension,
            targetExtension: currentState.validation.targetExtension,
          });

          if (!confirmed) {
            showToast({
              title: "Conversão cancelada",
              message: "Nenhuma alteração foi feita neste arquivo.",
              type: "info",
            });
            return;
          }

          showLoading({
            title: "Convertendo arquivo",
            text: `Estamos preparando ${currentState.label} no formato ${currentState.validation.targetExtension.toUpperCase()}.`,
          });

          try {
            const convertedFile = await convertFile(
              currentState.file,
              currentState.validation.targetExtension,
            );

            currentState.convertedFile = convertedFile;
            currentState.status = "converted";

            showToast({
              title: "Conversão concluída",
              message: `${currentState.file.name} foi convertido para ${currentState.validation.targetExtension.toUpperCase()}.`,
              type: "success",
            });
          } catch (error) {
            currentState.convertedFile = null;
            currentState.status = "error";

            showToast({
              title: "Falha na conversão",
              message:
                error.message ||
                "Não foi possível converter este arquivo agora.",
              type: "error",
            });
          } finally {
            hideLoading();
            renderDocStatus();
          }
        });

        actionsArea.appendChild(convertBtn);
      } else if (currentState.status === "converted") {
        status.className = "file-status premium-file-status info";
        status.textContent = `Arquivo convertido com sucesso para ${currentState.validation.targetExtension.toUpperCase()}: ${
          currentState.convertedFile?.name || currentState.file.name
        }`;
      } else if (currentState.status === "error") {
        status.className = "file-status premium-file-status warn";
        status.textContent =
          "Ocorreu um problema ao preparar a conversão. Tente novamente.";
      } else if (currentState.status === "invalid") {
        status.className = "file-status premium-file-status warn";
        status.textContent = currentState.validation.message;
      } else {
        status.className = "file-status premium-file-status";
        status.textContent = "Arquivo selecionado.";
      }

      refreshSelectedCount();
    }

    function handleSelectedFile(file) {
      const currentState = getDocState(doc.id);

      if (!file) {
        currentState.file = null;
        currentState.status = "empty";
        currentState.validation = null;
        currentState.convertedFile = null;
        renderDocStatus();
        return;
      }

      const validation = validateFile(file, doc);

      currentState.file = file;
      currentState.validation = validation;
      currentState.convertedFile = null;

      if (validation.isValid) {
        currentState.status = "valid";
      } else if (validation.canConvert) {
        currentState.status = "convertible";
      } else {
        currentState.status = "invalid";
      }

      renderDocStatus();
    }

    input.addEventListener("change", () => {
      handleSelectedFile(input.files[0] || null);
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.remove("dragover");
      });
    });

    dropzone.addEventListener("drop", (event) => {
      const files = event.dataTransfer.files;

      if (!files || !files.length) return;

      const transfer = new DataTransfer();
      transfer.items.add(files[0]);
      input.files = transfer.files;

      handleSelectedFile(files[0]);
    });

    removeBtn.addEventListener("click", () => {
      input.value = "";
      handleSelectedFile(null);
    });

    renderDocStatus();
  });
}

processBtn.addEventListener("click", async () => {
  const studentName = sanitizeName(studentNameInput.value);

  if (!studentName) {
    alert("Digite o nome completo do aluno antes de processar os arquivos.");
    studentNameInput.focus();
    return;
  }

  resultList.innerHTML = "";
  zipArea.innerHTML = "";

  const selectedDocs = documentState.filter((doc) => doc.file);

  if (!selectedDocs.length) {
    resultList.innerHTML =
      '<div class="empty">Nenhum arquivo foi enviado. Selecione pelo menos um documento.</div>';
    return;
  }

  const blockedDocs = selectedDocs.filter(
    (doc) => doc.status === "invalid" || doc.status === "convertible",
  );

  if (blockedDocs.length) {
    resultList.innerHTML = `
      <div class="empty">
        Ainda existem arquivos pendentes de correção ou conversão.
        Revise os cards sinalizados antes de continuar.
      </div>
    `;

    showToast({
      title: "Ação necessária",
      message:
        "Existem documentos que ainda precisam ser ajustados antes do processamento final.",
      type: "info",
    });

    return;
  }

  try {
    showLoading({
      title: "Preparando downloads",
      text: "Estamos organizando os arquivos renomeados e o pacote ZIP.",
    });

    const finalFiles = [];

    selectedDocs.forEach((doc) => {
      const finalFile = buildFinalFile(doc, studentName);

      if (!finalFile) return;

      finalFiles.push(finalFile);

      let message = "Arquivo pronto para download.";
      if (doc.status === "converted") {
        message = `Arquivo convertido com sucesso para ${doc.validation.targetExtension.toUpperCase()}.`;
      }

      const item = buildResultItem({
        label: doc.label,
        originalName: (doc.convertedFile || doc.file).name,
        finalName: finalFile.name,
        message,
        file: finalFile,
      });

      resultList.appendChild(item);
    });

    if (!finalFiles.length) {
      resultList.innerHTML =
        '<div class="empty">Nenhum arquivo válido foi preparado para download.</div>';
      return;
    }

    const zipLink = await createZipDownloadLink(
      finalFiles,
      `${studentName}_DOCUMENTOS.zip`,
    );

    zipLink.classList.add("zip-link", "premium-zip-link");
    zipArea.appendChild(zipLink);

    showToast({
      title: "Downloads prontos",
      message: "Os arquivos individuais e o ZIP foram preparados com sucesso.",
      type: "success",
    });
  } catch (error) {
    resultList.innerHTML = `
      <div class="empty">
        Ocorreu um erro ao preparar os downloads.
      </div>
    `;

    showToast({
      title: "Erro ao gerar downloads",
      message: error.message || "Não foi possível preparar os arquivos.",
      type: "error",
    });
  } finally {
    hideLoading();
  }
});

clearBtn.addEventListener("click", () => {
  studentNameInput.value = "";
  resultList.innerHTML =
    '<div class="empty">Nenhum arquivo processado ainda.</div>';
  zipArea.innerHTML = "";

  documentState.forEach((doc) => {
    doc.file = null;
    doc.status = "empty";
    doc.validation = null;
    doc.convertedFile = null;

    const input = document.getElementById(doc.id);
    const status = document.getElementById(`status_${doc.id}`);
    const removeBtn = document.getElementById(`remove_${doc.id}`);
    const actionsArea = document.getElementById(`actions_${doc.id}`);
    const badge = document.getElementById(`badge_${doc.id}`);
    const progress = document.getElementById(`progress_${doc.id}`);
    const summary = document.getElementById(`summary_${doc.id}`);
    const preview = document.getElementById(`preview_${doc.id}`);
    const card = document.querySelector(`[data-doc-id="${doc.id}"]`);

    if (input) input.value = "";

    if (status) {
      status.className = "file-status premium-file-status warn";
      status.textContent = "Nenhum arquivo selecionado.";
    }

    if (removeBtn) {
      removeBtn.classList.remove("show");
    }

    if (actionsArea) {
      actionsArea.innerHTML = "";
    }

    if (badge) {
      badge.textContent = "Aguardando";
      badge.className = "doc-status-badge tone-neutral";
    }

    if (progress) {
      progress.style.width = "0%";
    }

    if (summary) {
      summary.textContent = "Nenhum arquivo enviado ainda.";
    }

    if (preview) {
      clearPreview(preview);
    }

    if (card) {
      card.dataset.state = "empty";
    }
  });

  refreshSelectedCount();
});

themeToggle.addEventListener("click", () => {
  const currentTheme = document.body.getAttribute("data-theme");
  applyTheme(currentTheme === "dark" ? "light" : "dark");
});

initTheme();
createDocumentCards();
refreshSelectedCount();
