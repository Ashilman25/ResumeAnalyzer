const TESTING_MODE = false; // Set to false to return to normal mode
const SAMPLE_PDF_PATH = './sample_resume.pdf'; // Place a PDF in your frontend folder

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

  /* build card‑style containers for each section */
  improvedBox.innerHTML = "";              // clear old content

(data.sections || []).forEach(s => {
  const box = document.createElement("div");
  box.className = "info-container";

  // ---------- assemble inner HTML ----------
  box.innerHTML = `
    <!-- title + score -->
    <div class="section">
      <h1 class="main-title">
        ${s.section}
        <span style="font-size:.9rem; font-weight:400;">&nbsp;(score ${s.score})</span>
      </h1>
    </div>

    <!-- strengths -->
    <div class="section">
      <h2 class="section-title">Strengths</h2>
      <ul>${(s.strengths||[]).map(str => `<li>${str}</li>`).join("")}</ul>
      <div class="separator"></div>
    </div>

    <!-- improvements -->
    <div class="section">
      <h2 class="section-title">Improvements</h2>
      <ul>${(s.improvements||[]).map(im => `<li>${im}</li>`).join("")}</ul>
      ${s.rewrittenBullets?.length ? '<div class="separator"></div>' : ''}
    </div>

    ${s.rewrittenBullets?.length ? `
      <!-- suggested bullets -->
      <div class="section">
        <h2 class="section-title">Suggested Bullets</h2>
        <ul>${s.rewrittenBullets.map(b => `<li>${b}</li>`).join("")}</ul>
      </div>` : ""}
  `;
  // -----------------------------------------

  improvedBox.appendChild(box);
});

  /* render original PDF; don’t break UI if it fails */
  try {
    const blobUrl = URL.createObjectURL(originalFile);
    await renderPDF(blobUrl, 'pdfOriginal');
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('PDF render failed', err);
  }

  /* download handler – flattens cards to plain text */
  document.getElementById('downloadBtn').onclick = () => {
    const plain = [...improvedBox.querySelectorAll('.sec-card')]
      .map(card => card.innerText.trim())
      .join('\n\n');
    downloadImproved(plain);
  };
}

function loadTestEnvironment() {
  if (!TESTING_MODE) return;
  
  // Hide upload view, show results view
  document.getElementById('upload-view').classList.add('hidden');
  document.getElementById('results-view').classList.remove('hidden');
  
  // Option 1: Use fetch to get the PDF as a blob
  fetch(SAMPLE_PDF_PATH)
    .then(response => response.blob())
    .then(blob => {
      // Create a File object from the blob
      const sampleFile = new File([blob], "sample_resume.pdf", { type: "application/pdf" });
      
      // Use the blob URL for rendering
      const blobUrl = URL.createObjectURL(sampleFile);
      renderPDF(blobUrl, 'pdfOriginal');
      
      // Sample analysis response
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
