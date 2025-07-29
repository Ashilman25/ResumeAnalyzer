const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const browseBtn = document.getElementById('browseBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const spinner = document.getElementById('spinner');
const uploadView = document.getElementById('upload-view');
const resultsView = document.getElementById('results-view');
const improvedBox = document.getElementById('improvedText');

const selectedFileDisplay = document.getElementById('selectedFileDisplay');
const selectedFileName    = document.getElementById('selectedFileName');
const removeFileBtn       = document.getElementById('removeFileBtn');

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

// make it async
async function renderResults(data, originalFile) {
  uploadView.classList.add('hidden');
  resultsView.classList.remove('hidden');

  const scoresPanel = document.getElementById('scoresPanel');
  scoresPanel.innerHTML = `
    <h2>Overall Score: ${data.overall.score}</h2>
    <p>${data.overall.summary}</p>
  `;

  // Build improved text FIRST so even if PDF fails, you still see it
  const improvedText = data.sections.map(s => {
    const bullets = (s.rewrittenBullets || []).map(b => '• ' + b).join('\n');
    return `## ${s.section} (score: ${s.score})
Strengths: ${s.strengths.join('; ')}
Improvements: ${s.improvements.join('; ')}

${bullets}\n`;
  }).join('\n\n');

  improvedBox.textContent = improvedText;

  // Render PDF safely
  try {
    const blobUrl = URL.createObjectURL(originalFile);
    await renderPDF(blobUrl, 'pdfOriginal');
    URL.revokeObjectURL(blobUrl);
  } catch (e) {
    console.error("PDF render failed", e);
  }

  document.getElementById('downloadBtn').onclick = () => downloadImproved(improvedText);
}


function downloadImproved(text) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Improved_Resume_v1.txt';
  a.click();
  URL.revokeObjectURL(url);
}
