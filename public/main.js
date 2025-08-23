const TESTING_MODE = false; 
const SAMPLE_PDF_PATH = './sample_resume.pdf'; 

// ✅ Choose API base automatically: use local when developing, else Hosting proxy
const API_BASE = window.location.hostname.includes('localhost')
  ? 'http://localhost:8080/api'   // when you run uvicorn locally
  : '/api';                       // when deployed on Firebase Hosting

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
  browseBtn.disabled = true;               
  fileInput.disabled = true;               
  dropzone.classList.add('disabled');      
}

function clearSelected() {
  selectedFile = null;
  fileInput.value = "";
  analyzeBtn.disabled = true;
  selectedFileName.textContent = "";              
  selectedFileDisplay.classList.add('hidden');    
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
    // ⬇️ CHANGED: go through Hosting rewrite
    const res = await fetch(`${API_BASE}/analyze`, { method: 'POST', body: formData });
    const txt = await res.text();
    if (!res.ok) throw new Error(txt || 'Analyze failed');
    const data = JSON.parse(txt);
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

function showDraftOverlay(html){
  /* freeze background scroll */
  document.body.classList.add('no-scroll');

  /* -------- 1 · floating toolbar (outside dimmer) -------- */
  const toolbar = document.createElement('div');
  toolbar.id = 'draftToolbar';
  toolbar.innerHTML = `
    <!-- COMPLETE toolbar markup -->
    <select id="style">
      <option value="p">Normal text</option>
      <option value="h1">Title</option>
      <option value="h2">Heading 1</option>
      <option value="h3">Heading 2</option>
    </select>

    <select id="fontName">
      <option selected>Arial</option>
      <option>Times New Roman</option>
      <option>Georgia</option>
      <option>Courier New</option>
    </select>

    <div class="icon-pair">
      <button id="fontMinus" title="Smaller"><i class="fa-solid fa-minus"></i></button>
      <input id="fontSize" type="number" value="14" min="8" max="96" style="width:48px">
      <button id="fontPlus"  title="Bigger"><i class="fa-solid fa-plus"></i></button>
    </div>

    <button data-command="bold"      title="Bold"><i class="fa-solid fa-bold"></i></button>
    <button data-command="italic"    title="Italic"><i class="fa-solid fa-italic"></i></button>
    <button data-command="underline" title="Underline"><i class="fa-solid fa-underline"></i></button>

    <input type="color" id="foreColor"   title="Text colour">
    <input type="color" id="hiliteColor" title="Highlight">

    <button id="createLink"  title="Insert link"><i class="fa-solid fa-link"></i></button>
    <button id="insertImage" title="Insert image"><i class="fa-regular fa-image"></i></button>
    <input  id="imageInput" type="file" accept="image/*" hidden>

    <button data-command="justifyLeft"   title="Align left"><i class="fa-solid fa-align-left"></i></button>
    <button data-command="justifyCenter" title="Align centre"><i class="fa-solid fa-align-center"></i></button>
    <button data-command="justifyRight"  title="Align right"><i class="fa-solid fa-align-right"></i></button>

    <button data-command="insertUnorderedList" title="Bulleted list"><i class="fa-solid fa-list-ul"></i></button>
    <button data-command="insertOrderedList"   title="Numbered list"><i class="fa-solid fa-list-ol"></i></button>

    <button data-command="outdent" title="Decrease indent"><i class="fa-solid fa-outdent"></i></button>
    <button data-command="indent"  title="Increase indent"><i class="fa-solid fa-indent"></i></button>

    <button id="removeFormat" title="Clear formatting"><i class="fa-solid fa-eraser"></i></button>
  `;

  document.body.appendChild(toolbar);

  /* -------- 2 · dimmer + sheet -------- */
  const dimmer = document.createElement('div');
  dimmer.id = 'draftDimmer';
  document.body.appendChild(dimmer);

  const sheet = document.createElement('div');
  sheet.className = 'draft-sheet';
  dimmer.appendChild(sheet);

  /* editable region */
  const editor = document.createElement('div');
  editor.id = 'draftEditor';
  editor.contentEditable = true;
  editor.innerHTML = html;
  sheet.appendChild(editor);

  /* -------- 3 · close & download -------- */
  const closeBtn = document.createElement('button');
  closeBtn.id = 'draftCloseBtn';
  closeBtn.innerHTML = '×';
  document.body.appendChild(closeBtn);

  const downloadBtn = document.createElement('button');
  downloadBtn.id = 'draftDownloadBtn';
  downloadBtn.innerHTML = '⇩';
  document.body.appendChild(downloadBtn);

  /* -------- 4 · teardown -------- */
  const tearDown = () => {
    [toolbar,dimmer,closeBtn,downloadBtn].forEach(el=>el.remove());
    document.body.classList.remove('no-scroll');
  };
  closeBtn.onclick = tearDown;
  document.addEventListener('keydown',e=>e.key==='Escape'&&tearDown(),{once:true});

  /* -------- 5 · download logic (unchanged) -------- */
  downloadBtn.onclick = () => {
    const prev = {width:sheet.style.width,height:sheet.style.height,overflow:sheet.style.overflow};
    sheet.style.height = sheet.scrollHeight + 'px';
    sheet.style.overflow = 'visible';
    sheet.style.width   = '7.7in';
    html2pdf().set({margin:0.4,filename:'Resume_Draft.pdf',
                    image:{type:'jpeg',quality:0.98},
                    html2canvas:{scale:2},
                    jsPDF:{unit:'in',format:'letter',orientation:'portrait'}})
              .from(sheet).save()
              .then(()=>Object.assign(sheet.style,prev))
              .catch(console.error);
  };

  /* -------- 6 · activate mini-docs commands -------- */
  initDraftRichText(toolbar,editor);
}


//The google drive editing bar
function initDraftRichText(toolbar, editor){

  //const toolbar = document.getElementById('toolbar');
  //const editor  = document.getElementById('draftEditor');

  /* helper: execCommand font-size in px */
  const applyFontSize = px=>{
    document.execCommand('styleWithCSS',false,true);
    document.execCommand('fontSize',false,7);
    const el = document.querySelector('font[size="7"]');
    if(el){ el.removeAttribute('size'); el.style.fontSize = px+'px'; }
  };

  /* click buttons */
  toolbar.addEventListener('click',e=>{
    const btn = e.target.closest('button');
    if(!btn) return;

    if(btn.id==='insertImage'){
      document.getElementById('imageInput').click(); return;
    }
    if(btn.id==='createLink'){
      const url = prompt('URL:','https://'); if(url) document.execCommand('createLink',false,url); return;
    }
    if(btn.id==='removeFormat'){ document.execCommand('removeFormat'); return; }

    const cmd = btn.dataset.command;
    if(cmd){ document.execCommand(cmd,false,null);
             btn.classList.toggle('active',document.queryCommandState(cmd)); }
  });

  /* dropdowns */
  document.getElementById('style')
          .addEventListener('change',e=>document.execCommand('formatBlock',false,e.target.value));
  document.getElementById('fontName')
          .addEventListener('change',e=>document.execCommand('fontName',false,e.target.value));

  /* font size number & +/- */
  const sizeInput = document.getElementById('fontSize');
  document.getElementById('fontPlus').addEventListener('click',()=>bump(1));
  document.getElementById('fontMinus').addEventListener('click',()=>bump(-1));
  sizeInput.addEventListener('change',()=>applyFontSize(sizeInput.value));
  const bump = d=>{
    sizeInput.value = Math.max(8,Math.min(96,(+sizeInput.value||14)+d));
    applyFontSize(sizeInput.value);
  };

  /* colours */
  document.getElementById('foreColor')
          .addEventListener('input',e=>document.execCommand('foreColor',false,e.target.value));
  document.getElementById('hiliteColor')
          .addEventListener('input',e=>document.execCommand('hiliteColor',false,e.target.value));

  /* image picker */
  document.getElementById('imageInput').addEventListener('change',e=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>document.execCommand('insertImage',false,ev.target.result);
    reader.readAsDataURL(file); e.target.value='';
  });

  /* keep button states fresh when selection changes */
  ['keyup','mouseup'].forEach(evt=>
    editor.addEventListener(evt,()=>{
      toolbar.querySelectorAll('[data-command]').forEach(btn=>{
        btn.classList.toggle('active',document.queryCommandState(btn.dataset.command));
      });
    })
  );
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

        const res = await fetch(`${API_BASE}/draft`, { method: 'POST', body: fd });

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
