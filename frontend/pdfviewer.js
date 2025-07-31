// Basic PDF.js setup
// Assumes pdfjsLib is loaded globally from vendor/pdfjs/pdf.js
//pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdfjs/pdf.worker.js';

async function renderPDF(url, containerId) {
  const pdf       = await pdfjsLib.getDocument(url).promise;
  const container = document.getElementById(containerId);

  /* -------- Button injection (runs once and re-used on re-renders) -------- */
  let editBtn = container.querySelector('.edit-btn');
  if (!editBtn) {
    editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.title     = 'Edit original PDF';

    /* feather-style pencil icon (inline SVG so no extra HTTP requests) */
    editBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor"
           fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"></path>
      </svg>`;

    /* TODO: hook this up to whatever editing flow you want */
    editBtn.onclick = () => alert('Edit feature coming soon!');

    container.appendChild(editBtn);
  }

  /* -------- (Re)render PDF pages -------- */
  // Remove old canvases only – keep the button alive
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