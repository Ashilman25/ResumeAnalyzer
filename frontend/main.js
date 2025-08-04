const TESTING_MODE = false; 
const SAMPLE_PDF_PATH = './sample_resume.pdf'; 

const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const browseBtn = document.getElementById('browseBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const spinner = document.getElementById('spinner');
const uploadView = document.getElementById('upload-view');
const resultsView = document.getElementById('results-view');
const improvedBox = document.getElementById('improvedText');

const selectedFileDisplay = document.getElementById('selectedFileDisplay');
const selectedFileName = document.getElementById('selectedFileName');
const removeFileBtn = document.getElementById('removeFileBtn');

let selectedFile = null;

browseBtn.onclick = () => {
  if (!selectedFile) fileInput.click();
};

function showSelected(file) {
  selectedFile = file;
  analyzeBtn.disabled = !selectedFile;
  selectedFileName.textContent = file.name;
  selectedFileDisplay.classList.remove('hidden');
  browseBtn.disabled = true;               // grey out
  fileInput.disabled = true;               // disable file input
  dropzone.classList.add('disabled');      // visually gray out dropzone
}

function clearSelected() {
  selectedFile = null;
  fileInput.value = "";
  analyzeBtn.disabled = true;
  selectedFileName.textContent = "";                // clear name
  selectedFileDisplay.classList.add('hidden');      // hide name + X
  browseBtn.disabled = false;
  fileInput.disabled = false;
  dropzone.classList.remove('disabled');
}

removeFileBtn.onclick = clearSelected;

fileInput.onchange = (e) => {
  if (!e.target.files.length) return;
  showSelected(e.target.files[0]);
};

// Drag & drop logic
dropzone.addEventListener('dragover', e => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  if (selectedFile) return; // already have one, ignore
  const file = e.dataTransfer.files[0];
  if (file && file.type === 'application/pdf') {
    showSelected(file);
  } else {
    alert("Please drop a single PDF.");
  }
});

analyzeBtn.onclick = async () => {
  const industry = document.getElementById('industrySelect').value;
  spinner.classList.remove('hidden');
  analyzeBtn.disabled = true;

  const formData = new FormData();
  formData.append('pdf', selectedFile);
  formData.append('targetIndustry', industry);

  try {
    const res = await fetch('http://localhost:8000/analyze', { method: 'POST', body: formData });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    await renderResults(data, selectedFile);
  } catch (err) {
    alert("Error analyzing Resume. Try again.");
    console.error(err);
  } finally {
    spinner.classList.add('hidden');
    analyzeBtn.disabled = false;
  }
};

/* build a score badge once and return as HTML                        */
function makeScoreLabel(score, size = 120, extraClass = '') {
  return `
    <div class="score-label ${extraClass}" data-score="${score}">
      <svg viewBox="0 0 100 100">
        <circle class="circle-bg"       cx="50" cy="50" r="45"></circle>
        <circle class="circle-progress" cx="50" cy="50" r="45"></circle>
      </svg>
      <div class="score-text">${score}</div>
    </div>`;
}

/* initialise every .score-label that’s now in the DOM                */
function initScoreLabels() {
  document.querySelectorAll('.score-label').forEach(label => {
    const score = +label.dataset.score || 0;
    const circle = label.querySelector('.circle-progress');
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;

    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference * (1 - score / 100);
    label.querySelector('.score-text').textContent = score;
  });
}

function wireCollapsibles() {
  document.querySelectorAll('.info-container').forEach(container => {
    const header  = container.querySelector('.section-header');
    const content = container.querySelector('.section-content');
    const toggle  = container.querySelector('.toggle-btn');

    const setExpanded = (exp) => {
      content.classList.toggle('expanded', exp);
      toggle.classList.toggle('expanded', exp);
      toggle.setAttribute('aria-expanded', exp);
      header.setAttribute ('aria-expanded', exp);
      content.setAttribute('aria-hidden' , !exp);
      container.setAttribute('data-expanded', exp);
    };

    // default collapsed unless the server marks it open
    setExpanded(container.getAttribute('data-expanded') === 'true');

    header.addEventListener('click',  e => { if (e.target!==toggle) setExpanded(!content.classList.contains('expanded')); });
    toggle.addEventListener('click',  e => { e.stopPropagation(); setExpanded(!content.classList.contains('expanded')); });
    header.addEventListener('keydown',e => { if ([' ','Enter'].includes(e.key)) { e.preventDefault(); setExpanded(!content.classList.contains('expanded')); }});
  });
}

function showDraftOverlay(html) {
  /* 0 — Freeze background scroll */
  document.body.classList.add('no-scroll');

  /* 1 — Dimmer + editable sheet */
  const dimmer = document.createElement('div');
  dimmer.id = 'draftDimmer';
  document.body.appendChild(dimmer);

  const sheet  = document.createElement('div');
  sheet.className = 'draft-sheet';
  sheet.contentEditable = true;
  sheet.innerHTML = html;
  dimmer.appendChild(sheet);

  /* 2 — CLOSE button (top-left) */
  const closer = document.createElement('button');
  closer.id = 'draftCloseBtn';
  closer.type = 'button';
  closer.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M13 5L5 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M5 5L13 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  document.body.appendChild(closer);

  /* 3 — DOWNLOAD button (top-right) */
  const downloader = document.createElement('button');
  downloader.id = 'draftDownloadBtn';
  downloader.type = 'button';
  downloader.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v14m0 0l-4-4m4 4l4-4M5 21h14" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  document.body.appendChild(downloader);

  /* 4 — Helpers */
  const tearDown = () => {
    dimmer.remove();
    closer.remove();
    downloader.remove();
    document.body.classList.remove('no-scroll');
  };

  /* 5 — Events */
  closer.addEventListener('click', tearDown);
  document.addEventListener('keydown',
    (e)=>{ if (e.key === 'Escape') tearDown(); },
    { once:true }
  );

  downloader.addEventListener('click', () => {
    /* remember current inline styles */
    const prev = { width: sheet.style.width,
                  height: sheet.style.height,
                  overflow: sheet.style.overflow };

    /* 1 — make the node fully visible */
    sheet.style.height   = sheet.scrollHeight + 'px';
    sheet.style.overflow = 'visible';

    /* 2 — shrink it to the printable width: 8.5 in − 2×0.4 in */
    sheet.style.width = '7.7in';

    /* 3 — export */
    html2pdf().set({
        margin: 0.4,
        filename: 'Resume_Draft.pdf',
        image: { type:'jpeg', quality:0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      })
      .from(sheet)
      .save()
      .then(() => {
        /* 4 — restore everything exactly as it was */
        Object.assign(sheet.style, prev);
      })
      .catch(console.error);
  });


}



// Basic PDF.js setup
async function renderResults(data, originalFile) {
  /* view swap */
  uploadView.classList.add('hidden');
  resultsView.classList.remove('hidden');
  
  // Add Generate Draft button to top right of results page
  if (!document.getElementById('generateDraftBtn')) {
    const generateDraftBtn = document.createElement('button');
    generateDraftBtn.id = 'generateDraftBtn';
    generateDraftBtn.className = 'generate-draft-btn';
    generateDraftBtn.textContent = 'Generate Draft';

    generateDraftBtn.onclick = async () => {
      // full-page loading veil
      const veil = document.createElement('div');
      veil.id = 'draftLoading';
      veil.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(veil);

      try {
        const fd = new FormData();
        fd.append('pdf', selectedFile);
        fd.append('targetIndustry',
                  document.getElementById('industrySelect').value);

        const res = await fetch('http://localhost:8000/draft', {
          method: 'POST', body: fd
        });
        if (!res.ok) throw new Error(await res.text());
        const { html } = await res.json();
        showDraftOverlay(html);
      } catch (e) {
        alert('Failed to generate draft'); console.error(e);
      } finally {
        veil.remove();                 // hide buffer view
      }
    };
    
    // Add to results view in top right position
    resultsView.appendChild(generateDraftBtn);
  }
  
  /* overall score block */
  const scoresPanel = document.getElementById('scoresPanel');
  scoresPanel.innerHTML = `
    <h2>Overall Score: ${data.overall.score}</h2>
    <p>${data.overall.summary}</p>
  `;

  /* ---------- SECTION CARDS ---------- */
  improvedBox.innerHTML = "";              // clear old content

(data.sections || []).forEach(s => {
  const box = document.createElement("div");
  box.className = "info-container";

  // ---------- assemble inner HTML ----------
  box.innerHTML = `
  <!-- ====== COLLAPSIBLE HEADER ====== -->
  <div class="section-header"
       tabindex="0" aria-expanded="false"
       role="button" aria-controls="sec-${s.section}-content">

    <h1 class="main-title">${s.section}</h1>

    ${makeScoreLabel(s.score, 60, 'small')}

    <button class="toggle-btn"
            aria-label="Expand ${s.section} section"
            aria-controls="sec-${s.section}-content"
            aria-expanded="false">&#94;</button>
  </div>

  <!-- ====== COLLAPSIBLE BODY ====== -->
  <div class="section-content"
       id="sec-${s.section}-content"
       aria-hidden="true">

    <div class="section-subsection">
      <h2>Strengths</h2>
      <ul>${(s.strengths||[]).map(str => `<li>${str}</li>`).join('')}</ul>
      <div class="separator"></div>
    </div>

    <div class="section-subsection">
      <h2>Improvements</h2>
      <ul>${(s.improvements||[]).map(im => `<li>${im}</li>`).join('')}</ul>
      ${(s.rewrittenBullets?.length) ? '<div class="separator"></div>' : ''}
    </div>

    ${(s.rewrittenBullets?.length) ? `
      <div class="section-subsection">
        <h2>Suggested Bullets</h2>
        <ul>${s.rewrittenBullets.map(b => `<li>${b}</li>`).join('')}</ul>
      </div>` : ''}
  </div>
  `;
  // -----------------------------------------

  improvedBox.appendChild(box);
});

  try {
    const blobUrl = URL.createObjectURL(originalFile);
    await renderPDF(blobUrl, 'pdfOriginal');
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('PDF render failed', err);
  }

  initScoreLabels(); 
  wireCollapsibles(); 
}

function loadTestEnvironment() {
  if (!TESTING_MODE) return;
  

  document.getElementById('upload-view').classList.add('hidden');
  document.getElementById('results-view').classList.remove('hidden');
  
  fetch(SAMPLE_PDF_PATH)
    .then(response => response.blob())
    .then(blob => {

      const sampleFile = new File([blob], "sample_resume.pdf", { type: "application/pdf" });
  
      const blobUrl = URL.createObjectURL(sampleFile);
      renderPDF(blobUrl, 'pdfOriginal');
      
  
      const sampleResponse = {
        "overall": {
          "score": 75,
          "summary": "This is a strong resume that highlights relevant experience...",
          "improvements": "Consider quantifying achievements more consistently..."
        },
        "sections": [
          {
            "name": "Summary",
            "score": 70,
            "strengths": ["Clear professional identity", "Highlights key expertise"],
            "improvements": ["Add a specific achievement", "Mention target role"],
            "section": "Summary", // Make sure this matches your renderResults expectations
            "rewrittenBullets": ["Sample bullet point 1", "Sample bullet point 2"]
          },
          {
            "name": "Experience",
            "score": 85,
            "section": "Experience", // Make sure this matches your renderResults expectations
            "strengths": ["Strong action verbs", "Quantified results"],
            "improvements": ["Add more metrics", "Focus on most relevant achievements"],
            "rewrittenBullets": ["Sample bullet point 1", "Sample bullet point 2"]
          }
        ]
      };
      
      // Process the sample response with the file
      renderResults(sampleResponse, sampleFile);
    })
    .catch(err => {
      console.error("Error loading test PDF:", err);
      // Fallback to just showing the results without PDF
      const sampleResponse = {
        "overall": {
          "score": 75,
          "summary": "This is a strong resume that highlights relevant experience...",
          "improvements": "Consider quantifying achievements more consistently..."
        },
        "sections": [
          {
            "name": "Summary",
            "score": 70,
            "strengths": ["Clear professional identity", "Highlights key expertise"],
            "improvements": ["Add a specific achievement", "Mention target role"],
            "section": "Summary", // Make sure this matches your renderResults expectations
            "rewrittenBullets": ["Sample bullet point 1", "Sample bullet point 2"]
          },
          {
            "name": "Experience",
            "score": 85,
            "section": "Experience", // Make sure this matches your renderResults expectations
            "strengths": ["Strong action verbs", "Quantified results"],
            "improvements": ["Add more metrics", "Focus on most relevant achievements"],
            "rewrittenBullets": ["Sample bullet point 1", "Sample bullet point 2"]
          }
        ]
      };
      renderResults(sampleResponse, null);
    });
}

// Call this at the end of your window.onload or main code
if (TESTING_MODE) {
  loadTestEnvironment();
}
