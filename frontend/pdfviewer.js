// pdfviewer.js  — full file, edit-mode ready 🎉
async function renderPDF(url, containerId) {
  const pdf       = await pdfjsLib.getDocument(url).promise;
  const container = document.getElementById(containerId);
  const pane      = container.closest('.pane');   // the column that owns “Original”

  /* ───────────────────────────────────────────
     Cache the floating controls & pencil
     ─────────────────────────────────────────── */
  let editBtn  = container.querySelector('.edit-btn');
  let ctrlBar  = pane.querySelector('.edit-controls'); // may already exist

  /* ───────────────────────────────────────────
     Helper: leave edit mode
     ─────────────────────────────────────────── */
  const exitEditMode = () => {
    container.classList.remove('editing');
    document.getElementById('results-view').classList.remove('editing-active');

    if (ctrlBar) ctrlBar.classList.add('hidden');
    if (editBtn) editBtn.style.display = '';
  };

  /* ───────────────────────────────────────────
     Helper: enter edit mode
     ─────────────────────────────────────────── */
  const enterEditMode = () => {
    container.classList.add('editing');
    document.getElementById('results-view').classList.add('editing-active');

    /* Build the control bar once */
    if (!ctrlBar) {
      ctrlBar = document.createElement('div');
      ctrlBar.className = 'edit-controls';

      // SAVE
      const saveBtn = document.createElement('button');
      saveBtn.className = 'edit-save';
      saveBtn.textContent = 'Save';
      saveBtn.onclick = () => { alert('Saved'); exitEditMode(); };

      // CANCEL
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'edit-cancel';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.onclick = exitEditMode;

      ctrlBar.append(saveBtn, cancelBtn);

      /* Insert right under the <h3> “Original” title */
      pane.insertBefore(ctrlBar, container);
    }

    ctrlBar.classList.remove('hidden');
    if (editBtn) editBtn.style.display = 'none';
  };

  /* ───────────────────────────────────────────
     Pencil button (build once)
     ─────────────────────────────────────────── */
  if (!editBtn) {
    editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.title     = 'Edit original PDF';
    editBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20"
           stroke="currentColor" fill="none" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"></path>
      </svg>`;
    editBtn.onclick = enterEditMode;
    container.appendChild(editBtn);
  } else {
    editBtn.onclick = enterEditMode;     // hot-reload safety
  }

  /* ───────────────────────────────────────────
     (Re)render every page
     ─────────────────────────────────────────── */
  container.querySelectorAll('canvas').forEach(c => c.remove());

  for (let p = 1; p <= pdf.numPages; p++) {
    const page      = await pdf.getPage(p);
    const viewport  = page.getViewport({ scale: 1.2 });

    const canvas    = document.createElement('canvas');
    const ctx       = canvas.getContext('2d');
    canvas.width    = viewport.width;
    canvas.height   = viewport.height;

    container.appendChild(canvas);
    await page.render({ canvasContext: ctx, viewport }).promise;
  }
}

window.renderPDF = renderPDF;
