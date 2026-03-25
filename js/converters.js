function isImageFile(file) {
  return file.type.startsWith("image/");
}

function isPdfFile(file) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível carregar a imagem."));
    };

    img.src = url;
  });
}

function canvasToBlob(canvas, mimeType, quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Falha ao gerar o arquivo convertido."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

function getExtension(name) {
  if (!name.includes(".")) return "";
  return name.split(".").pop().toLowerCase();
}

function replaceExtension(name, newExt) {
  if (!name.includes(".")) {
    return `${name}.${newExt}`;
  }

  return name.replace(/\.[^/.]+$/, `.${newExt}`);
}

export async function convertImageToJpg(file) {
  if (!isImageFile(file)) {
    throw new Error("Arquivo não é uma imagem válida para conversão em JPG.");
  }

  const img = await loadImage(file);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);

  return new File([blob], replaceExtension(file.name, "jpg"), {
    type: "image/jpeg",
  });
}

export async function convertImageToPdf(file) {
  if (!isImageFile(file)) {
    throw new Error("Arquivo não é uma imagem válida para conversão em PDF.");
  }

  const img = await loadImage(file);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const imageData = canvas.toDataURL("image/jpeg", 0.92);

  const { jsPDF } = window.jspdf;

  if (!jsPDF) {
    throw new Error("Biblioteca jsPDF não encontrada.");
  }

  const pdf = new jsPDF({
    orientation: img.width > img.height ? "landscape" : "portrait",
    unit: "px",
    format: [img.width, img.height],
  });

  pdf.addImage(imageData, "JPEG", 0, 0, img.width, img.height);

  const blob = pdf.output("blob");

  return new File([blob], replaceExtension(file.name, "pdf"), {
    type: "application/pdf",
  });
}

export async function convertPdfToJpg(file) {
  if (!isPdfFile(file)) {
    throw new Error("Arquivo não é um PDF válido para conversão em JPG.");
  }

  if (!window.pdfjsLib) {
    throw new Error("Biblioteca PDF.js não encontrada.");
  }

  const arrayBuffer = await file.arrayBuffer();

  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  if (pdf.numPages < 1) {
    throw new Error("O PDF não contém páginas para conversão.");
  }

  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 2 });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);

  return new File([blob], replaceExtension(file.name, "jpg"), {
    type: "image/jpeg",
  });
}

export async function convertFile(file, targetExtension) {
  const ext = getExtension(file.name);
  const normalizedTarget = targetExtension.toLowerCase();

  if (ext === normalizedTarget) {
    return file;
  }

  if (normalizedTarget === "jpg") {
    if (isImageFile(file)) {
      return await convertImageToJpg(file);
    }

    if (isPdfFile(file)) {
      return await convertPdfToJpg(file);
    }

    throw new Error("Este tipo de arquivo não pode ser convertido para JPG.");
  }

  if (normalizedTarget === "pdf") {
    if (isImageFile(file)) {
      return await convertImageToPdf(file);
    }

    throw new Error("Este tipo de arquivo não pode ser convertido para PDF.");
  }

  throw new Error("Tipo de conversão ainda não suportado.");
}
