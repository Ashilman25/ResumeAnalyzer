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

// Basic PDF.js setup
async function renderResults(data, originalFile) {
  /* view swap */
  uploadView.classList.add('hidden');
  resultsView.classList.remove('hidden');

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

  document.getElementById('downloadBtn').onclick = () => {
    const plain = [...improvedBox.querySelectorAll('.sec-card')]
      .map(card => card.innerText.trim())
      .join('\n\n');
    downloadImproved(plain);
  };


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

// function downloadImproved(text) {
//   const blob = new Blob([text], { type: 'text/plain' });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement('a');
//   a.href = url;
//   a.download = 'Improved_Resume_v1.txt';
//   a.click();
//   URL.revokeObjectURL(url);
// }
