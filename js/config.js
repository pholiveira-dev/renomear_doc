export const documents = [
  {
    id: "peticionamento_sei",
    label: "PETICIONAMENTO SEI",
    acceptedExtensions: ["pdf"],
    targetExtension: "pdf",
    convertibleFrom: ["jpg", "jpeg", "png"],
  },
  {
    id: "tce_fepecs",
    label: "TCE FEPECS",
    acceptedExtensions: ["pdf"],
    targetExtension: "pdf",
    convertibleFrom: ["jpg", "jpeg", "png", "webp"],
  },
  {
    id: "foto_3x4",
    label: "FOTO 3x4",
    acceptedExtensions: ["jpg", "jpeg"],
    targetExtension: "jpg",
    convertibleFrom: ["pdf", "png", "webp"],
  },
  {
    id: "cartao_vacina",
    label: "CARTÃO DE VACINA",
    acceptedExtensions: ["pdf"],
    targetExtension: "pdf",
    convertibleFrom: ["jpg", "jpeg", "png"],
  },
  {
    id: "tce_iges",
    label: "TCE IGES",
    acceptedExtensions: ["pdf"],
    targetExtension: "pdf",
    convertibleFrom: ["jpg", "jpeg", "png", "webp"],
  },
  {
    id: "curso_fepecs",
    label: "CURSO FEPECS",
    acceptedExtensions: ["pdf"],
    targetExtension: "pdf",
    convertibleFrom: ["jpg", "jpeg", "png"],
  },
  {
    id: "curso_iges",
    label: "CURSO IGES",
    acceptedExtensions: ["pdf"],
    targetExtension: "pdf",
    convertibleFrom: ["jpg", "jpeg", "png"],
  },
];

function criarCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function carregarImagem(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

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

function obterPixel(imageData, x, y) {
  const { width, data } = imageData;
  const offset = (y * width + x) * 4;
  return [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]];
}

function pixelÉQuaseBranco(r, g, b, a) {
  if (a === 0) return false;
  const minChannel = Math.min(r, g, b);
  const maxChannel = Math.max(r, g, b);
  return maxChannel >= 235 && minChannel >= 215 && maxChannel - minChannel <= 40;
}

function pixelÉBrancoOuFundo(r, g, b, a) {
  return pixelÉQuaseBranco(r, g, b, a);
}

function analisarLinha(imageData, y, step = 1) {
  const { width } = imageData;
  let whiteCount = 0;
  let total = 0;
  let longestWhiteRun = 0;
  let currentRun = 0;

  for (let x = 0; x < width; x += step) {
    const [r, g, b, a] = obterPixel(imageData, x, y);
    const isWhite = pixelÉBrancoOuFundo(r, g, b, a);

    if (isWhite) {
      whiteCount += 1;
      currentRun += 1;
      longestWhiteRun = Math.max(longestWhiteRun, currentRun);
    } else {
      currentRun = 0;
    }

    total += 1;
  }

  return {
    whiteRatio: total === 0 ? 0 : whiteCount / total,
    longestWhiteRun,
    width: total,
  };
}

function analisarColuna(imageData, x, top, bottom, step = 1) {
  const { height } = imageData;
  const yStart = Math.max(0, top);
  const yEnd = Math.min(height - 1, bottom);
  let whiteCount = 0;
  let total = 0;
  let longestWhiteRun = 0;
  let currentRun = 0;

  for (let y = yStart; y <= yEnd; y += step) {
    const [r, g, b, a] = obterPixel(imageData, x, y);
    const isWhite = pixelÉBrancoOuFundo(r, g, b, a);

    if (isWhite) {
      whiteCount += 1;
      currentRun += 1;
      longestWhiteRun = Math.max(longestWhiteRun, currentRun);
    } else {
      currentRun = 0;
    }

    total += 1;
  }

  return {
    whiteRatio: total === 0 ? 0 : whiteCount / total,
    longestWhiteRun,
    height: total,
  };
}

function ehBordaBrancaLateral(metrics) {
  const { whiteRatio, longestWhiteRun, height } = metrics;
  const contiguousRatio = height > 0 ? longestWhiteRun / height : 0;
  return (
    (whiteRatio >= 0.92 && contiguousRatio >= 0.82) ||
    (whiteRatio >= 0.94 && contiguousRatio >= 0.75) ||
    (whiteRatio >= 0.96 && contiguousRatio >= 0.65)
  );
}

function ehBordaBrancaSuperiorInferior(metrics) {
  const { whiteRatio, longestWhiteRun, width } = metrics;
  const contiguousRatio = width > 0 ? longestWhiteRun / width : 0;
  return (
    (whiteRatio >= 0.93 && contiguousRatio >= 0.85) ||
    (whiteRatio >= 0.95 && contiguousRatio >= 0.75) ||
    (whiteRatio >= 0.97 && contiguousRatio >= 0.6)
  );
}

function obterBordaBranca(canvas) {
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("O parâmetro deve ser um elemento HTMLCanvasElement.");
  }

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);

  const minBorder = Math.max(4, Math.round(Math.min(width, height) * 0.008));
  const maxBorderDepth = Math.max(30, Math.round(Math.min(width, height) * 0.18));

  let top = 0;
  while (
    top < height / 2 &&
    top < maxBorderDepth &&
    ehBordaBrancaSuperiorInferior(analisarLinha(imageData, top, 1))
  ) {
    top += 1;
  }

  let bottom = 0;
  while (
    bottom < height / 2 &&
    bottom < maxBorderDepth &&
    ehBordaBrancaSuperiorInferior(analisarLinha(imageData, height - 1 - bottom, 1))
  ) {
    bottom += 1;
  }

  const verticalStart = Math.max(top, Math.floor(height * 0.05));
  const verticalEnd = Math.min(height - 1 - bottom, Math.floor(height * 0.95));

  let left = 0;
  while (
    left < width / 2 &&
    left < maxBorderDepth &&
    ehBordaBrancaLateral(analisarColuna(imageData, left, verticalStart, verticalEnd, 1))
  ) {
    left += 1;
  }

  let right = 0;
  while (
    right < width / 2 &&
    right < maxBorderDepth &&
    ehBordaBrancaLateral(analisarColuna(imageData, width - 1 - right, verticalStart, verticalEnd, 1))
  ) {
    right += 1;
  }

  const requiresAdjustment =
    width - left - right > 0 &&
    height - top - bottom > 0 &&
    (top >= minBorder || bottom >= minBorder || left >= minBorder || right >= minBorder);

  return {
    left,
    top,
    right,
    bottom,
    requiresAdjustment,
  };
}

export async function processarFoto3x4(fileInput) {
  const file = fileInput instanceof File ? fileInput : fileInput?.files?.[0] || null;

  if (!file || !file.type.startsWith("image/")) {
    throw new Error("É necessário fornecer um arquivo de imagem válido.");
  }

  const img = await carregarImagem(file);
  const canvas = criarCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const border = obterBordaBranca(canvas);
  return border.requiresAdjustment;
}

export function cortarBordas(canvasOriginal) {
  if (!(canvasOriginal instanceof HTMLCanvasElement)) {
    throw new Error("O parâmetro deve ser um elemento HTMLCanvasElement.");
  }

  let currentCanvas = canvasOriginal;

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const border = obterBordaBranca(currentCanvas);
    if (!border.requiresAdjustment) {
      break;
    }

    const croppedWidth = currentCanvas.width - border.left - border.right;
    const croppedHeight = currentCanvas.height - border.top - border.bottom;

    if (croppedWidth <= 0 || croppedHeight <= 0) {
      break;
    }

    const croppedCanvas = criarCanvas(croppedWidth, croppedHeight);
    const croppedCtx = croppedCanvas.getContext("2d");
    croppedCtx.drawImage(
      currentCanvas,
      border.left,
      border.top,
      croppedWidth,
      croppedHeight,
      0,
      0,
      croppedWidth,
      croppedHeight,
    );

    currentCanvas = croppedCanvas;
  }

  return currentCanvas;
}

function canvasParaBlob(canvas, mimeType, quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Falha ao gerar o arquivo de imagem."));
        return;
      }
      resolve(blob);
    }, mimeType, quality);
  });
}

export async function recortarFoto3x4Arquivo(file, quality = 0.92) {
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    throw new Error("É necessário fornecer um arquivo de imagem de imagem para recorte.");
  }

  const img = await carregarImagem(file);
  const canvas = criarCanvas(img.naturalWidth, img.naturalHeight);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const croppedCanvas = cortarBordas(canvas);
  if (croppedCanvas.width === canvas.width && croppedCanvas.height === canvas.height) {
    return file;
  }

  const blob = await canvasParaBlob(croppedCanvas, file.type, quality);
  return new File([blob], file.name, {
    type: file.type,
    lastModified: Date.now(),
  });
}

