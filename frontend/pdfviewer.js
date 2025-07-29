// Basic PDF.js setup
// Assumes pdfjsLib is loaded globally from vendor/pdfjs/pdf.js
//pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdfjs/pdf.worker.js';

async function renderPDF(url, containerId) {
  const pdf = await pdfjsLib.getDocument(url).promise;
  const container = document.getElementById(containerId);
  container.innerHTML = ""; 

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1.2 });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width  = viewport.width;
    container.appendChild(canvas);

    await page.render({ canvasContext: ctx, viewport }).promise;
  }
}

window.renderPDF = renderPDF;
