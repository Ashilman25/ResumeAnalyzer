// pdfviewer.js  — full file, edit-mode ready 🎉
async function renderPDF(url, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const loadingTask = pdfjsLib.getDocument(url);
  const pdf = await loadingTask.promise;
  
  // Clear existing content
  container.querySelectorAll('canvas').forEach(c => c.remove());

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1.2 });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    container.appendChild(canvas);
    await page.render({ canvasContext: ctx, viewport }).promise;
  }
}

window.renderPDF = renderPDF;
