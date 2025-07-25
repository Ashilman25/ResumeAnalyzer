// Basic PDF.js setup
// Assumes pdfjsLib is loaded globally from vendor/pdfjs/pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdfjs/pdf.worker.js';

async function renderPDF(url, canvasId, pageNumber=1) {
  const pdf = await pdfjsLib.getDocument(url).promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1.2 });
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  const renderContext = { canvasContext: ctx, viewport: viewport };
  await page.render(renderContext).promise;
}

window.renderPDF = renderPDF;
