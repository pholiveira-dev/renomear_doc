const documents = [
  { id: "tce_fepecs", label: "TCE FEPECS", accepts: "*" },
  { id: "cadastro_sei", label: "CADASTRO SEI", accepts: "*" },
  { id: "tce_iges", label: "TCE IGES", accepts: "*" },
  {
    id: "foto_3x4",
    label: "FOTO 3x4",
    accepts: "image/jpeg,image/jpg,.jpeg,.jpg",
  },
  { id: "cartao_vacina", label: "CARTÃO DE VACINA", accepts: "*" },
  { id: "curso_fepecs", label: "CURSO FEPECS", accepts: "*" },
  { id: "curso_iges", label: "CURSO IGES", accepts: "*" },
];

const imageAsJpgLabels = new Set(["FOTO 3x4"]);

const documentGrid = document.getElementById("documentGrid");
const resultList = document.getElementById("resultList");
const zipArea = document.getElementById("zipArea");
const processBtn = document.getElementById("processBtn");
const clearBtn = document.getElementById("clearBtn");
const studentNameInput = document.getElementById("studentName");
const selectedCount = document.getElementById("selectedCount");
const docCount = document.getElementById("docCount");
const themeToggle = document.getElementById("themeToggle");

docCount.textContent = documents.length;

function sanitizeName(name) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function refreshSelectedCount() {
  let total = 0;

  documents.forEach((doc) => {
    const input = document.getElementById(doc.id);
    if (input?.files?.length) total += 1;
  });

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

function createDocumentCards() {
  documents.forEach((doc) => {
    const card = document.createElement("div");
    card.className = "doc-card";

    card.innerHTML = `
      <div class="doc-card-head">
        <h3>${doc.label}</h3>
        <span class="doc-badge">Opcional</span>
      </div>
      <small>Clique ou arraste o arquivo para esta área.</small>
      <label class="dropzone" for="${doc.id}" id="drop_${doc.id}">
        Clique para selecionar ou arraste o arquivo aqui
      </label>
      <input class="file-input" type="file" id="${doc.id}" ${
        doc.accepts !== "*" ? `accept="${doc.accepts}"` : ""
      } />
      <div class="file-status" id="status_${doc.id}">Nenhum arquivo selecionado.</div>
      <div class="file-actions">
        <button type="button" class="remove-file-btn" id="remove_${doc.id}">Excluir arquivo</button>
      </div>
    `;

    documentGrid.appendChild(card);

    const input = card.querySelector(".file-input");
    const status = card.querySelector(".file-status");
    const dropzone = card.querySelector(".dropzone");
    const removeBtn = card.querySelector(".remove-file-btn");

    function updateStatus(file) {
      if (file) {
        status.className = "file-status ok";
        status.textContent = `Arquivo selecionado: ${file.name}`;
        removeBtn.classList.add("show");
      } else {
        status.className = "file-status warn";
        status.textContent = "Nenhum arquivo selecionado.";
        removeBtn.classList.remove("show");
      }

      refreshSelectedCount();
    }

    input.addEventListener("change", () => {
      updateStatus(input.files[0]);
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
      updateStatus(files[0]);
    });

    removeBtn.addEventListener("click", () => {
      input.value = "";
      updateStatus(null);
    });
  });
}

function getOriginalExtension(file) {
  if (!file.name.includes(".")) return "";
  return file.name.split(".").pop().toLowerCase();
}

function getFinalExtension(file, label) {
  if (imageAsJpgLabels.has(label)) return ".jpg";
  const ext = getOriginalExtension(file);
  return ext ? `.${ext}` : "";
}

async function fileToJpgIfNeeded(file, label) {
  if (!imageAsJpgLabels.has(label)) {
    return file;
  }

  const isJpegLike =
    file.type === "image/jpeg" || /\.(jpe?g)$/i.test(file.name);

  if (!isJpegLike) {
    throw new Error(`O documento ${label} precisa ser JPG ou JPEG.`);
  }

  const buffer = await file.arrayBuffer();
  return new File([buffer], "imagem.jpg", { type: "image/jpeg" });
}

async function buildProcessedEntry(file, studentName, label) {
  const finalFile = await fileToJpgIfNeeded(file, label);
  const finalExtension = getFinalExtension(finalFile, label);
  const newName = `${studentName}_${label}${finalExtension}`;
  const url = URL.createObjectURL(finalFile);

  const item = document.createElement("div");
  item.className = "result-item";
  item.innerHTML = `
    <strong>${label}</strong>
    <div class="old-name">Arquivo original: ${file.name}</div>
    <div class="new-name">Novo nome: ${newName}</div>
    <a class="download-link" href="${url}" download="${newName}">Baixar arquivo</a>
  `;

  return { item, newName, finalFile };
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

  const zip = new JSZip();
  let processedCount = 0;

  try {
    for (const doc of documents) {
      const input = document.getElementById(doc.id);
      const file = input.files[0];

      if (!file) continue;

      const processed = await buildProcessedEntry(file, studentName, doc.label);
      resultList.appendChild(processed.item);
      zip.file(processed.newName, processed.finalFile);
      processedCount += 1;
    }
  } catch (error) {
    resultList.innerHTML = `<div class="empty">${error.message}</div>`;
    return;
  }

  if (!processedCount) {
    resultList.innerHTML =
      '<div class="empty">Nenhum arquivo foi enviado. Selecione pelo menos um documento.</div>';
    return;
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const zipName = `${studentName}.zip`;
  const zipUrl = URL.createObjectURL(zipBlob);

  zipArea.innerHTML = `<a class="zip-link" href="${zipUrl}" download="${zipName}">Baixar tudo em ZIP</a>`;
});

clearBtn.addEventListener("click", () => {
  studentNameInput.value = "";
  resultList.innerHTML =
    '<div class="empty">Nenhum arquivo processado ainda.</div>';
  zipArea.innerHTML = "";

  documents.forEach((doc) => {
    const input = document.getElementById(doc.id);
    const status = document.getElementById(`status_${doc.id}`);
    const removeBtn = document.getElementById(`remove_${doc.id}`);

    if (input) input.value = "";

    if (status) {
      status.className = "file-status";
      status.textContent = "Nenhum arquivo selecionado.";
    }

    if (removeBtn) {
      removeBtn.classList.remove("show");
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
