const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const browseBtn = document.getElementById('browseBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const spinner = document.getElementById('spinner');
const uploadView = document.getElementById('upload-view');
const resultsView = document.getElementById('results-view');
const improvedBox = document.getElementById('improvedText');

let selectedFile = null;

browseBtn.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
  selectedFile = e.target.files[0];
  analyzeBtn.disabled = !selectedFile;
};

dropzone.addEventListener('dragover', e => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  selectedFile = e.dataTransfer.files[0];
  analyzeBtn.disabled = !selectedFile;
});

analyzeBtn.onclick = async () => {
  const industry = document.getElementById('industrySelect').value;
  spinner.classList.remove('hidden');
  analyzeBtn.disabled = true;

  const formData = new FormData();
  formData.append('pdf', selectedFile);
  formData.append('targetIndustry', industry);

  try {
    const res = await fetch('http://localhost:8000/analyze', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || "Error analyzing resume. Try again.");
      return; // Stop if error
    }
    const data = await res.json();
    renderResults(data, selectedFile);
  } catch (err) {
    alert("Error analyzing resume. Try again.");
    console.error(err);
  } finally {
    spinner.classList.add('hidden');
    analyzeBtn.disabled = false;
  }
};

function renderResults(data, originalFile) {
  uploadView.classList.add('hidden');
  resultsView.classList.remove('hidden');

  // Scores
  const scoresPanel = document.getElementById('scoresPanel');
  scoresPanel.innerHTML = `
    <h2>Overall Score: ${data.overall.score}</h2>
    <p>${data.overall.summary}</p>
  `;

  // Render Original PDF
  renderPDF(URL.createObjectURL(originalFile), 'pdfOriginal');

  // Improved draft text (simple join of rewritten bullets per section)
  const improvedText = data.sections.map(s => {
    const bullets = s.rewrittenBullets.map(b => '• ' + b).join('\n');
    return `## ${s.section} (score: ${s.score})\nStrengths: ${s.strengths.join('; ')}\nImprovements: ${s.improvements.join('; ')}\n\n${bullets}\n`;
  }).join('\n\n');

  improvedBox.textContent = improvedText;

  // Tabs or accordion could go here (TODO)
  // Download button
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
