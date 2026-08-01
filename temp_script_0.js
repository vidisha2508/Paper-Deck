
  let selectedFile = null;
  let currentPaperId = null;
  let activeSearchId = 0;

  function switchTab(tab){
    const topicInput = document.getElementById('topicInput');
    const dropzone = document.getElementById('dropzone');
    const tabTopic = document.getElementById('tab-topic');
    const tabPdf = document.getElementById('tab-pdf');
    hideError();
    currentPaperId = null;
    if(tab === 'topic'){
      topicInput.style.display = 'block';
      dropzone.classList.remove('show');
      tabTopic.classList.add('active');
      tabPdf.classList.remove('active');
    } else {
      topicInput.style.display = 'none';
      dropzone.classList.add('show');
      tabPdf.classList.add('active');
      tabTopic.classList.remove('active');
    }
  }

  function formatFileSize(bytes){
    if(bytes < 1024) return bytes + ' B';
    if(bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function setSelectedFile(file){
    hideError();
    if(!file) return;
    if(file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')){
      showError('Only PDF files are supported.');
      return;
    }
    selectedFile = file;
    currentPaperId = null;
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    document.getElementById('dropzoneEmpty').style.display = 'none';
    document.getElementById('dropzoneFile').classList.add('show');
  }

  function clearSelectedFile(){
    selectedFile = null;
    currentPaperId = null;
    document.getElementById('pdfInput').value = '';
    document.getElementById('dropzoneEmpty').style.display = 'block';
    document.getElementById('dropzoneFile').classList.remove('show');
  }

  window.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('dropzone');
    const input = document.getElementById('pdfInput');
    const fileRemove = document.getElementById('fileRemove');

    if (dropzone && input) {
      dropzone.addEventListener('click', (e) => {
        if(e.target.closest('.file-remove')) return;
        if(dropzone.classList.contains('drag-active')) return;
        input.click();
      });

      input.addEventListener('change', (e) => {
        if(e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
      });

      ['dragenter', 'dragover'].forEach(evt => {
        dropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          dropzone.classList.add('drag-active');
        });
      });
      ['dragleave', 'drop'].forEach(evt => {
        dropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          dropzone.classList.remove('drag-active');
        });
      });
      dropzone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if(file) setSelectedFile(file);
      });
    }

    if (fileRemove) {
      fileRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        clearSelectedFile();
      });
    }
  });

  function showError(message){
    const banner = document.getElementById('errorBanner');
    document.getElementById('errorText').textContent = message;
    banner.classList.add('show');
  }

  function hideError(){
    document.getElementById('errorBanner').classList.remove('show');
  }

  function updateStatus(text){
    const step = document.getElementById('statusStep');
    document.getElementById('statusText').textContent = text;
    step.classList.add('show');
  }

  function hideStatus(){
    document.getElementById('statusStep').classList.remove('show');
  }

  function renderGaps(gaps){
    const el = document.getElementById('resultGaps');
    el.innerHTML = '';
    
    let gapList = [];
    if (typeof gaps === 'string') {
      gapList = parseBulletPoints(gaps);
    } else if (Array.isArray(gaps)) {
      gapList = gaps;
    }

    if (gapList.length === 0) {
      el.innerHTML = '<li>No research gaps detected.</li>';
      return;
    }

    gapList.forEach(gap => {
      if (typeof gap === 'object' && gap !== null) {
        const card = document.createElement('div');
        card.className = 'gap-card-item';
        const sev = (gap.severity || 'Medium').toLowerCase();
        const badgeClass = sev === 'high' ? 'badge-high' : (sev === 'low' ? 'badge-low' : 'badge-medium');
        
        card.innerHTML = `
          <h5>
            <span>${gap.title || 'Research Gap'}</span>
            <span class="badge-severity ${badgeClass}">${gap.severity || 'Medium'}</span>
          </h5>
          <p>${gap.description || ''}</p>
        `;
        el.appendChild(card);
      } else {
        const li = document.createElement('li');
        li.textContent = String(gap).replace(/^[\*\-\#\d\.\s]+/, '');
        el.appendChild(li);
      }
    });
  }

  function renderFindings(findings){
    const el = document.getElementById('resultFindings');
    el.innerHTML = '';

    let findingList = [];
    if (typeof findings === 'string') {
      findingList = parseBulletPoints(findings);
    } else if (Array.isArray(findings)) {
      findingList = findings;
    }

    if (findingList.length === 0) {
      el.innerHTML = '<li>No key findings extracted.</li>';
      return;
    }

    findingList.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        const card = document.createElement('div');
        card.className = 'finding-card-item';
        card.innerHTML = `
          <h5>${item.title || 'Key Finding'}</h5>
          <p>${item.impact || item.description || ''}</p>
        `;
        el.appendChild(card);
      } else {
        const li = document.createElement('li');
        li.textContent = String(item).replace(/^[\*\-\#\d\.\s]+/, '');
        el.appendChild(li);
      }
    });
  }

  function renderNovelty(noveltyData){
    const banner = document.getElementById('noveltyBanner');
    if (!noveltyData || noveltyData.novelty_score === undefined) {
      banner.style.display = 'none';
      return;
    }
    banner.style.display = 'flex';
    document.getElementById('noveltyScoreVal').textContent = noveltyData.novelty_score + '/100 Novelty';
    document.getElementById('noveltyReasonText').textContent = 'Rationale: ' + (noveltyData.reason || 'Assessed against retrieved literature.');
  }

  function renderIdeas(ideas){
    const el = document.getElementById('resultIdeas');
    el.innerHTML = '';
    
    let ideaList = [];
    if (typeof ideas === 'string') {
      ideaList = ideas.split(/(?=###|\n\d+\.|\n\*\*\d+)/).filter(s => s.trim().length > 5);
    } else if (Array.isArray(ideas)) {
      ideaList = ideas;
    }

    if (ideaList.length === 0) {
      ideaList = [ideas || 'No project ideas generated.'];
    }

    ideaList.slice(0, 6).forEach((idea, i) => {
      const card = document.createElement('div');
      card.className = 'idea-card';
      const tag = document.createElement('div');
      tag.className = 'idea-tag';
      tag.textContent = 'IDEA — ' + String(i + 1).padStart(2, '0');
      
      const h5 = document.createElement('h5');
      const p = document.createElement('p');

      if (typeof idea === 'object' && idea !== null) {
        h5.textContent = idea.title || 'Project Direction';
        p.textContent = idea.description || JSON.stringify(idea);
        
        const badges = document.createElement('div');
        badges.style.display = 'flex';
        badges.style.gap = '4px';
        badges.style.marginTop = '10px';
        badges.style.flexWrap = 'wrap';
        
        if (idea.novelty !== undefined) {
          const novBadge = document.createElement('span');
          novBadge.className = 'badge-severity badge-low';
          novBadge.style.fontSize = '9.5px';
          novBadge.textContent = idea.novelty + '% Novel';
          badges.appendChild(novBadge);
        }
        if (idea.difficulty) {
          const diffBadge = document.createElement('span');
          diffBadge.className = 'badge-severity badge-medium';
          diffBadge.style.fontSize = '9.5px';
          diffBadge.textContent = 'Diff: ' + idea.difficulty;
          badges.appendChild(diffBadge);
        }
        if (idea.impact) {
          const impBadge = document.createElement('span');
          impBadge.className = 'badge-severity badge-high';
          impBadge.style.fontSize = '9.5px';
          impBadge.textContent = 'Impact: ' + idea.impact;
          badges.appendChild(impBadge);
        }
        card.appendChild(tag);
        card.appendChild(h5);
        card.appendChild(p);
        card.appendChild(badges);
      } else {
        const text = String(idea).replace(/^[\#\*\-\d\.\s]+/, '').trim();
        const parts = text.split(/\n+/);
        h5.textContent = parts[0].replace(/[\*\#]/g, '').trim();
        p.textContent = parts.slice(1).join(' ').replace(/[\*\#]/g, '').trim() || 'Actionable research project building on retrieved paper gaps.';
        card.appendChild(tag);
        card.appendChild(h5);
        card.appendChild(p);
      }
      card.onclick = () => openIdeaExpansion(h5.textContent, p.textContent);
      card.style.cursor = 'pointer';

      const expandHint = document.createElement('div');
      expandHint.style.marginTop = '12px';
      expandHint.style.display = 'flex';
      expandHint.style.justifyContent = 'flex-end';
      expandHint.innerHTML = `<span style="width: 28px; height: 28px; border-radius: 50%; background: var(--paper); border: 2px solid var(--ink); display: inline-flex; align-items: center; justify-content: center; box-shadow: 2px 2px 0px var(--ink); color: var(--ink); font-family: monospace; font-size: 13px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>`;
      card.appendChild(expandHint);

      el.appendChild(card);
    });
  }

  function renderSources(sources){
    const panel = document.getElementById('sourcesPanel');
    const grid = document.getElementById('sourcesGrid');
    grid.innerHTML = '';
    if(!sources || sources.length === 0){
      panel.style.display = 'none';
      return;
    }
    panel.style.display = 'block';

    const seen = new Set();
    const uniqueSources = sources.filter(s => {
      const key = (s.paper_id || s.title || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    uniqueSources.forEach(s => {
      const a = document.createElement('a');
      a.className = 'source-item';
      a.href = s.external_url || '#';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      
      const title = document.createElement('div');
      title.className = 'source-title';
      title.textContent = s.title || s.paper_id || 'Research Paper';

      const meta = document.createElement('div');
      meta.className = 'source-meta';
      meta.innerHTML = `<span class="source-pill">${s.source || 'arXiv'}</span> <span>${s.year || ''}</span>`;

      a.appendChild(title);
      a.appendChild(meta);
      grid.appendChild(a);
    });
  }

  function parseBulletPoints(text){
    if(!text) return [];
    if(Array.isArray(text)) return text;
    return text
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line.length > 5 && !line.toLowerCase().startsWith('##'))
      .map(line => line.replace(/^[\*\-\#\d\.\s]+/, '').replace(/[\*\_]/g, '').trim())
      .filter(line => line.length > 3);
  }

  async function runAnalysis(){
    const btn = document.getElementById('analyzeBtn');
    const results = document.getElementById('results');
    const isTopicMode = document.getElementById('tab-topic').classList.contains('active');
    const topic = document.getElementById('topicInput').value.trim();

    if(btn.classList.contains('loading')) return;

    hideError();

    if(isTopicMode && !topic){
      showError('Enter a research topic before analyzing.');
      return;
    }
    if(!isTopicMode && !selectedFile){
      showError('Upload a PDF before analyzing.');
      return;
    }

    activeSearchId += 1;
    const currentSearchId = activeSearchId;

    btn.classList.add('loading');
    btn.disabled = true;
    results.classList.remove('show');

    // Clear previous DOM results so old topics don't persist
    document.getElementById('resultSummary').textContent = 'Analyzing document and generating grounded insights...';
    document.getElementById('resultFindings').innerHTML = '';
    document.getElementById('resultGaps').innerHTML = '';
    document.getElementById('resultIdeas').innerHTML = '';
    document.getElementById('sourcesGrid').innerHTML = '';
    document.getElementById('noveltyBanner').style.display = 'none';
    const tpCont = document.getElementById('evolutionTurningPoints'); if (tpCont) tpCont.innerHTML = '';
    const tnCont = document.getElementById('evolutionTimelineNodes'); if (tnCont) tnCont.innerHTML = '';
    const esCont = document.getElementById('evolutionSummaryBox'); if (esCont) esCont.innerHTML = '';
    const qaAns = document.getElementById('qaAnswer'); if (qaAns) { qaAns.innerHTML = ''; qaAns.classList.remove('show'); }

    try{
      let subject = topic;
      let totalPapers = 0;

      if(isTopicMode){
        currentPaperId = null;
        updateStatus('Step 1/3: Searching arXiv & indexing vector embeddings…');
        const ingestResp = await fetch('/ingest/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: topic, max_papers: 5 })
        });
        if(!ingestResp.ok){
          throw new Error('Paper ingestion failed (' + ingestResp.status + '). Check Gemini API Key.');
        }
        const ingestData = await ingestResp.json();
        totalPapers = ingestData.papers_found || 5;
      } else {
        updateStatus('Step 1/3: Uploading & extracting PDF text…');
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', selectedFile.name.replace(/\.pdf$/i, ''));
        subject = selectedFile.name.replace(/\.pdf$/i, '');

        const uploadResp = await fetch('/ingest/upload', {
          method: 'POST',
          body: formData
        });
        if(!uploadResp.ok){
          throw new Error('PDF upload failed (' + uploadResp.status + ').');
        }
        const uploadData = await uploadResp.json();
        currentPaperId = uploadData.paper_id;
        totalPapers = 1;
      }

      if (currentSearchId !== activeSearchId) return; // Stale request superseded by newer search

      updateStatus('Step 2/3: Generating research insights & structuring gaps…');
      
      const insightsResp = await fetch('/insights/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: subject, paper_id: currentPaperId, top_k: 5 })
      });

      if(!insightsResp.ok){
        throw new Error('Insight generation failed (' + insightsResp.status + ').');
      }
      const data = await insightsResp.json();

      if (currentSearchId !== activeSearchId) return;

      updateStatus('Step 3/3: Evaluating key findings & novelty score…');
      let findingsData = null;
      let noveltyData = null;

      try {
        const fResp = await fetch('/insights/findings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: subject, paper_id: currentPaperId, top_k: 5 })
        });
        if (fResp.ok) findingsData = await fResp.json();
      } catch(e) {}

      try {
        const nResp = await fetch('/insights/novelty', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: subject, paper_id: currentPaperId, top_k: 5 })
        });
        if (nResp.ok) noveltyData = await nResp.json();
      } catch(e) {}

      if (currentSearchId !== activeSearchId) return;

      document.getElementById('papersIngestedCount').textContent = totalPapers + ' papers indexed';
      document.getElementById('resultSummary').textContent = data.summary || data.report || 'Analysis complete.';

      renderNovelty(noveltyData);
      renderFindings(findingsData && findingsData.findings ? findingsData.findings : data.summary);
      renderGaps(data.gaps);
      renderIdeas(data.ideas);
      renderSources(data.sources);

      // Trigger Citation Network and Research Evolution Timeline reload for the current topic/paper
      try {
        if (typeof loadCitationNetwork === 'function') loadCitationNetwork(subject, currentSearchId);
      } catch (e) { console.error(e); }

      try {
        if (typeof loadEvolutionTimeline === 'function') loadEvolutionTimeline(subject, currentSearchId);
      } catch (e) { console.error(e); }

      results.classList.add('show');
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch(err){
      console.error(err);
      showError(err.message || 'Something went wrong while analyzing. Try again.');
    } finally{
      hideStatus();
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  async function askQuestion(){
    const qInput = document.getElementById('qaInput');
    const qBtn = document.getElementById('qaBtn');
    const answerEl = document.getElementById('qaAnswer');
    const queryText = qInput.value.trim();

    if(!queryText) return;

    qBtn.disabled = true;
    qBtn.textContent = 'Thinking…';
    answerEl.classList.remove('show');

    try {
      const resp = await fetch('/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, paper_id: currentPaperId })
      });
      if(!resp.ok) throw new Error('Query failed.');
      const data = await resp.json();
      
      const ans = data.answer;
      if (typeof ans === 'object' && ans !== null) {
        let html = `<div style="font-weight:700; font-size:15px; margin-bottom:8px;">${ans.direct_answer || ''}</div>`;
        if (ans.key_points && ans.key_points.length > 0) {
          html += `<div style="margin-top:10px; font-weight:700; font-size:12px; color:var(--text-soft); text-transform:uppercase; letter-spacing:0.04em;">Key Points</div><ul style="padding-left:18px; margin-top:4px; font-size:13.5px;">`;
          ans.key_points.forEach(kp => { html += `<li>${kp}</li>`; });
          html += `</ul>`;
        }
        if (ans.trade_offs && ans.trade_offs.length > 0) {
          html += `<div style="margin-top:10px; font-weight:700; font-size:12px; color:var(--text-soft); text-transform:uppercase; letter-spacing:0.04em;">Trade-Offs</div><ul style="padding-left:18px; margin-top:4px; font-size:13.5px;">`;
          ans.trade_offs.forEach(to => { html += `<li>${to}</li>`; });
          html += `</ul>`;
        }
        if (ans.confidence) {
          const confClass = ans.confidence.toLowerCase() === 'high' ? 'badge-low' : 'badge-medium';
          const citeStr = ans.citations_used && ans.citations_used.length > 0 ? ` · Citations: [${ans.citations_used.join(', ')}]` : '';
          html += `<div style="margin-top:12px;"><span class="badge-severity ${confClass}">Confidence: ${ans.confidence}${citeStr}</span></div>`;
        }
        answerEl.innerHTML = html;
      } else {
        answerEl.textContent = String(ans || 'No answer generated.');
      }
      answerEl.classList.add('show');
    } catch(err) {
      answerEl.textContent = 'Error querying vector store: ' + err.message;
      answerEl.classList.add('show');
    } finally {
      qBtn.disabled = false;
      qBtn.textContent = 'Ask';
    }
  }
  // ---------- Idea Expansion & Lineage Tree Functions ----------
  let currentTreeLineage = [];
  let currentTreeDepth = 1;

  async function openIdeaExpansion(parentTitle, parentDesc) {
    currentTreeLineage = [parentTitle];
    currentTreeDepth = 1;
    await fetchAndRenderChildren(parentTitle, parentDesc);
  }

  async function drillDeeper(childTitle, childDesc) {
    currentTreeLineage.push(childTitle);
    currentTreeDepth += 1;
    await fetchAndRenderChildren(childTitle, childDesc);
  }

  function closeIdeaModal() {
    document.getElementById('ideaModal').classList.remove('show');
  }

  async function fetchAndRenderChildren(ideaTitle, ideaDesc) {
    const modal = document.getElementById('ideaModal');
    const titleEl = document.getElementById('modalParentTitle');
    const descEl = document.getElementById('modalParentDesc');
    const depthEl = document.getElementById('modalDepthTag');
    const trailEl = document.getElementById('breadcrumbTrail');
    const loadingEl = document.getElementById('modalLoading');
    const listEl = document.getElementById('modalChildList');

    modal.classList.add('show');
    titleEl.textContent = ideaTitle;
    descEl.textContent = ideaDesc || '';
    depthEl.textContent = `DEPTH ${currentTreeDepth} · 5 RESEARCH DIMENSIONS`;
    trailEl.textContent = currentTreeLineage.join(' > ');
    
    loadingEl.style.display = 'block';
    listEl.innerHTML = '';

    try {
      const resp = await fetch('/insights/ideas/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: ideaTitle,
          lineage: currentTreeLineage,
          depth: currentTreeDepth
        })
      });

      if (!resp.ok) throw new Error('Expansion failed (' + resp.status + ').');
      const data = await resp.json();
      loadingEl.style.display = 'none';

      const children = data.child_ideas || [];
      if (!Array.isArray(children) || children.length === 0) {
        listEl.innerHTML = `<div style="padding: 20px; font-weight: 600;">No child ideas returned. Raw: ${JSON.stringify(data.child_ideas)}</div>`;
        return;
      }

      children.forEach((c, idx) => {
        const card = document.createElement('div');
        card.className = 'child-idea-card';

        const cat = c.category || `Dimension ${idx+1}`;
        const title = c.title || 'Child Idea';
        const desc = c.description || '';
        const q = c.research_question ? `<div style="margin-top: 8px; font-style: italic; font-size: 13px; color: var(--purple);"><strong>Research Q:</strong> ${c.research_question}</div>` : '';
        
        const badgesHtml = `
          <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;">
            <span class="badge-severity badge-low" style="font-size: 9.5px;">${c.novelty || 75}% Novel</span>
            <span class="badge-severity badge-medium" style="font-size: 9.5px;">Diff: ${c.difficulty || 'Medium'}</span>
            <span class="badge-severity badge-high" style="font-size: 9.5px;">Impact: ${c.impact || 'High'}</span>
          </div>
        `;

        const cleanTitle = title.replace(/'/g, "\\'");
        const cleanDesc = desc.replace(/'/g, "\\'");

        card.innerHTML = `
          <div style="font-family: 'IBM Plex Mono'; font-size: 11px; font-weight: 700; color: var(--purple); text-transform: uppercase;">${cat}</div>
          <h5 style="font-family: 'Space Grotesk'; font-size: 16px; font-weight: 700; margin: 4px 0 6px 0;">${title}</h5>
          <p style="font-size: 13.5px; color: var(--text-soft); font-weight: 500; margin: 0;">${desc}</p>
          ${q}
          ${badgesHtml}
          <button class="drill-btn" onclick="drillDeeper('${cleanTitle}', '${cleanDesc}')">Drill Deeper (Depth ${currentTreeDepth + 1})</button>
        `;
        listEl.appendChild(card);
      });
    } catch(err) {
      loadingEl.style.display = 'none';
      listEl.innerHTML = `<div style="color: red; font-weight: 600; padding: 20px;">Error expanding idea: ${err.message}</div>`;
    }
  }

  // ---------- Citation Network Graph Implementation ----------
  let cyInstance = null;
  let currentLayoutName = 'cose';

  async function loadCitationNetwork(topic = '', requestId = null) {
    try {
      const targetTopic = topic || document.getElementById('topicInput')?.value || '';
      const badge = document.getElementById('graphTopicBadge');
      if (badge) badge.textContent = targetTopic ? (targetTopic.length > 22 ? targetTopic.substring(0, 20) + '...' : targetTopic) : 'Document Network';

      const resp = await fetch('/papers/citation-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: targetTopic, paper_id: currentPaperId })
      });
      if (requestId && requestId !== activeSearchId) return;
      if (!resp.ok) throw new Error('Failed to load citation network (' + resp.status + ').');
      const data = await resp.json();
      if (requestId && requestId !== activeSearchId) return;
      renderCytoscapeGraph(data);
    } catch (err) {
      console.error('Citation Network Error:', err);
    }
  }

  async function loadEvolutionTimeline(topicOverride, requestId = null) {
    const topic = topicOverride || document.getElementById('topicInput')?.value || "";
    if (!topic && !currentPaperId) {
      renderEvolutionTimeline(null);
      return;
    }
    try {
      const res = await fetch('/insights/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic, paper_id: currentPaperId })
      });
      if (requestId && requestId !== activeSearchId) return;
      if (res.ok) {
        const data = await res.json();
        currentEvolutionData = (data && data.papers && data.papers.length > 0) ? data : null;
      } else {
        currentEvolutionData = null;
      }
    } catch (e) {
      currentEvolutionData = null;
    }
    if (requestId && requestId !== activeSearchId) return;
    renderEvolutionTimeline(currentEvolutionData);
  }

  function renderEvolutionTimeline(data) {
    const tpContainer = document.getElementById('evolutionTurningPoints');
    const nodesContainer = document.getElementById('evolutionTimelineNodes');
    const summaryBox = document.getElementById('evolutionSummaryBox');

    if (!data || !data.papers || data.papers.length === 0) {
      if (tpContainer) tpContainer.innerHTML = '<div style="color:var(--text-soft); font-size:13px; grid-column: 1/-1;">Upload a PDF or enter a research topic and click Analyze to discover key turning points.</div>';
      if (nodesContainer) nodesContainer.innerHTML = '<div style="color:var(--text-soft); font-size:13px; padding-left: 20px;">Timeline milestones will appear here after analysis.</div>';
      if (summaryBox) summaryBox.innerHTML = '<div style="color:var(--text-soft); font-size:13px;">Evolution summary will be generated upon analysis.</div>';
      return;
    }

    // 1. Key Turning Points
    if (tpContainer && data.turning_points) {
      const tp = data.turning_points;
      tpContainer.innerHTML = `
        <div onclick="openPaperById('${tp.most_influential_paper?.id}')" style="background: var(--paper); border: 2px solid var(--ink); border-radius: 12px; padding: 16px; box-shadow: 4px 4px 0px var(--ink); cursor: pointer; transition: transform .15s;" onmouseover="this.style.transform='translate(-2px,-2px)'" onmouseout="this.style.transform='none'">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span class="badge-severity badge-high" style="margin: 0;">MOST INFLUENTIAL</span>
            <span style="font-family:'IBM Plex Mono'; font-size:11px; font-weight:700;">${tp.most_influential_paper?.year || 2017}</span>
          </div>
          <h5 style="font-family:'Space Grotesk'; font-size:15px; font-weight:700; color:var(--ink); margin-bottom:6px;">${escapeHtml(tp.most_influential_paper?.title || 'Foundational Study')}</h5>
          <p style="font-size:12.5px; color:var(--text-soft); margin-bottom:8px;">${escapeHtml(tp.most_influential_paper?.reason || '')}</p>
          <div style="display: flex; justify-content: flex-end;">
            <span style="width: 28px; height: 28px; border-radius: 50%; background: var(--pastel-purple); border: 2px solid var(--ink); display: flex; align-items: center; justify-content: center; box-shadow: 2px 2px 0px var(--ink); color: var(--ink);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>
          </div>
        </div>

        <div onclick="openPaperById('${tp.most_cited_paper?.id}')" style="background: var(--paper); border: 2px solid var(--ink); border-radius: 12px; padding: 16px; box-shadow: 4px 4px 0px var(--ink); cursor: pointer; transition: transform .15s;" onmouseover="this.style.transform='translate(-2px,-2px)'" onmouseout="this.style.transform='none'">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span class="badge-severity badge-low" style="margin: 0;">MOST CITED</span>
            <span style="font-family:'IBM Plex Mono'; font-size:11px; font-weight:700;">${(tp.most_cited_paper?.citation_count || 0).toLocaleString()} Cites</span>
          </div>
          <h5 style="font-family:'Space Grotesk'; font-size:15px; font-weight:700; color:var(--ink); margin-bottom:6px;">${escapeHtml(tp.most_cited_paper?.title || 'Benchmark Paper')}</h5>
          <p style="font-size:12.5px; color:var(--text-soft); margin-bottom:8px;">Benchmark paper driving significant citation volume and academic derivative research.</p>
          <div style="display: flex; justify-content: flex-end;">
            <span style="width: 28px; height: 28px; border-radius: 50%; background: var(--pastel-pink); border: 2px solid var(--ink); display: flex; align-items: center; justify-content: center; box-shadow: 2px 2px 0px var(--ink); color: var(--ink);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>
          </div>
        </div>

        <div style="background: var(--paper); border: 2px solid var(--ink); border-radius: 12px; padding: 16px; box-shadow: 4px 4px 0px var(--ink);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span class="badge-severity badge-medium" style="margin: 0;">METHODOLOGY SHIFT (${tp.biggest_methodology_shift?.year || 2024})</span>
          </div>
          <h5 style="font-family:'Space Grotesk'; font-size:14.5px; font-weight:700; color:var(--ink); margin-bottom:6px;">${escapeHtml(tp.biggest_methodology_shift?.title || 'Shift')}</h5>
          <p style="font-size:12px; color:var(--text-soft); margin-bottom:4px;"><strong>From:</strong> ${escapeHtml(tp.biggest_methodology_shift?.from_method || '')}</p>
          <p style="font-size:12px; color:var(--purple); font-weight:600;"><strong>To:</strong> ${escapeHtml(tp.biggest_methodology_shift?.to_method || '')}</p>
        </div>

        <div style="background: var(--pastel-yellow); border: 2px solid var(--ink); border-radius: 12px; padding: 16px; box-shadow: 4px 4px 0px var(--ink);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span class="badge-severity badge-low" style="margin: 0; background: var(--paper);">EMERGING TREND</span>
          </div>
          <h5 style="font-family:'Space Grotesk'; font-size:15px; font-weight:700; color:var(--ink); margin-bottom:6px;">${escapeHtml(tp.emerging_trend?.trend || '')}</h5>
          <p style="font-size:12.5px; color:var(--text-soft);">${escapeHtml(tp.emerging_trend?.description || '')}</p>
        </div>
      `;
    }

    // 2. Timeline Nodes
    if (nodesContainer && data.papers) {
      const sorted = [...data.papers].sort((a, b) => a.year - b.year);
      nodesContainer.innerHTML = sorted.map((p, idx) => `
        <div onclick="openPaperModalIndex(${idx})" style="position: relative; margin-bottom: 24px; padding-left: 48px; cursor: pointer;">
          <!-- Node Dot -->
          <div style="position: absolute; left: 16px; top: 12px; transform: translateX(-50%); width: 20px; height: 20px; border-radius: 50%; background: var(--yellow); border: 2.5px solid var(--ink); box-shadow: 2px 2px 0px var(--ink); z-index: 2; transition: transform .15s;" onmouseover="this.style.transform='translateX(-50%) scale(1.3)'" onmouseout="this.style.transform='translateX(-50%) scale(1)'"></div>
          
          <!-- Node Card -->
          <div style="background: var(--paper); border: 2.5px solid var(--ink); border-radius: 14px; padding: 18px; box-shadow: 5px 5px 0px var(--ink); transition: transform .15s, box-shadow .15s;" onmouseover="this.style.transform='translate(-2px,-2px)'; this.style.boxShadow='7px 7px 0px var(--ink)'" onmouseout="this.style.transform='none'; this.style.boxShadow='5px 5px 0px var(--ink)'">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span class="badge-severity badge-medium" style="margin: 0; font-size: 11px;">YEAR ${p.year}</span>
              <span style="font-family: 'IBM Plex Mono'; font-size: 11.5px; font-weight: 700; color: var(--purple);">${(p.citation_count || 0).toLocaleString()} Citations</span>
            </div>
            <h5 style="font-family: 'Space Grotesk'; font-size: 16.5px; font-weight: 700; color: var(--ink); margin-bottom: 6px;">${escapeHtml(p.title)}</h5>
            <p style="font-size: 13px; color: var(--text-soft); font-weight: 500; margin-bottom: 8px;">${escapeHtml(p.contribution)}</p>
            <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; font-family: 'IBM Plex Mono'; font-size: 11px; font-weight: 700; color: var(--purple); margin-top: 10px;">
              <span style="flex: 1; min-width: 0; word-break: break-word; line-height: 1.4;">Authors: ${escapeHtml((p.authors || []).join(', '))}</span>
              <span style="width: 32px; height: 32px; min-width: 32px; min-height: 32px; flex-shrink: 0; border-radius: 50%; background: var(--pastel-purple); border: 2px solid var(--ink); display: inline-flex; align-items: center; justify-content: center; box-shadow: 2px 2px 0px var(--ink); color: var(--ink);"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>
            </div>
          </div>
        </div>
      `).join('');
    }

    // 3. Evolution Summary
    if (summaryBox && data.summary) {
      const sum = data.summary;
      const breakthroughsHtml = (sum.major_breakthroughs || []).map(b => `<li style="margin-bottom:6px; font-size:13px; color:var(--ink);">${escapeHtml(b)}</li>`).join('');
      summaryBox.innerHTML = `
        <div style="background: var(--pastel-purple); border: 2px solid var(--ink); border-radius: 12px; padding: 18px; box-shadow: 4px 4px 0px var(--ink);">
          <div style="font-family:'Space Grotesk'; font-size:15px; font-weight:700; color:var(--ink); margin-bottom:10px;">Major Breakthroughs</div>
          <ul style="list-style:disc; padding-left:18px; margin:0;">${breakthroughsHtml}</ul>
        </div>
        <div style="background: var(--pastel-blue); border: 2px solid var(--ink); border-radius: 12px; padding: 18px; box-shadow: 4px 4px 0px var(--ink);">
          <div style="font-family:'Space Grotesk'; font-size:15px; font-weight:700; color:var(--ink); margin-bottom:10px;">Methodology Evolution</div>
          <p style="font-size:13px; color:var(--ink); font-weight:500;">${escapeHtml(sum.methodology_evolution || '')}</p>
        </div>
        <div style="background: var(--pastel-green); border: 2px solid var(--ink); border-radius: 12px; padding: 18px; box-shadow: 4px 4px 0px var(--ink);">
          <div style="font-family:'Space Grotesk'; font-size:15px; font-weight:700; color:var(--ink); margin-bottom:10px;">Current State of Research</div>
          <p style="font-size:13px; color:var(--ink); font-weight:500;">${escapeHtml(sum.current_state || '')}</p>
        </div>
      `;
    }
  }

  function openPaperModalIndex(idx) {
    if (!currentEvolutionData || !currentEvolutionData.papers) return;
    const sorted = [...currentEvolutionData.papers].sort((a, b) => a.year - b.year);
    const paper = sorted[idx];
    if (paper) showPaperModalDetails(paper);
  }

  function openPaperById(id) {
    if (!currentEvolutionData || !currentEvolutionData.papers) return;
    const paper = currentEvolutionData.papers.find(p => p.id === id);
    if (paper) showPaperModalDetails(paper);
  }

  function showPaperModalDetails(paper) {
    const modal = document.getElementById('paperEvolutionModal');
    const content = document.getElementById('paperEvolutionModalContent');
    if (!modal || !content) return;

    content.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <span class="badge-severity badge-medium" style="margin:0; font-size: 11px;">PUBLICATION YEAR ${paper.year}</span>
        <span class="badge-severity badge-low" style="margin:0; font-size: 11px;">${(paper.citation_count || 0).toLocaleString()} CITATIONS</span>
      </div>
      <h3 style="font-family:'Space Grotesk', sans-serif; font-size: 22px; font-weight: 700; color: var(--ink); margin-bottom: 10px; line-height: 1.25;">${escapeHtml(paper.title)}</h3>
      <p style="font-size: 13px; color: var(--text-soft); font-weight: 600; margin-bottom: 16px;"><strong>Authors:</strong> ${escapeHtml((paper.authors || []).join(', '))}</p>

      <div style="display: grid; grid-template-columns: 1fr; gap: 14px; text-align: left;">
        <div style="background: var(--pastel-purple); border: 2px solid var(--ink); border-radius: 12px; padding: 14px;">
          <div style="font-family:'IBM Plex Mono'; font-size: 11px; font-weight: 700; color: var(--purple); margin-bottom: 4px;">MAIN CONTRIBUTION</div>
          <p style="font-size: 13.5px; color: var(--ink); font-weight: 500;">${escapeHtml(paper.contribution || 'N/A')}</p>
        </div>

        <div style="background: var(--pastel-blue); border: 2px solid var(--ink); border-radius: 12px; padding: 14px;">
          <div style="font-family:'IBM Plex Mono'; font-size: 11px; font-weight: 700; color: var(--blue); margin-bottom: 4px;">METHODOLOGY USED</div>
          <p style="font-size: 13.5px; color: var(--ink); font-weight: 500;">${escapeHtml(paper.methodology || 'N/A')}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div style="background: var(--pastel-pink); border: 2px solid var(--ink); border-radius: 12px; padding: 14px;">
            <div style="font-family:'IBM Plex Mono'; font-size: 11px; font-weight: 700; color: #900; margin-bottom: 4px;">KEY LIMITATION</div>
            <p style="font-size: 12.5px; color: var(--ink); font-weight: 500;">${escapeHtml(paper.limitation || 'N/A')}</p>
          </div>

          <div style="background: var(--pastel-green); border: 2px solid var(--ink); border-radius: 12px; padding: 14px;">
            <div style="font-family:'IBM Plex Mono'; font-size: 11px; font-weight: 700; color: #006020; margin-bottom: 4px;">FUTURE SCOPE</div>
            <p style="font-size: 12.5px; color: var(--ink); font-weight: 500;">${escapeHtml(paper.future_scope || 'N/A')}</p>
          </div>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  }

  function closePaperEvolutionModal() {
    const modal = document.getElementById('paperEvolutionModal');
    if (modal) modal.style.display = 'none';
  }

  function handleEvolutionModalBackdrop(e) {
    if (e.target.id === 'paperEvolutionModal') {
      closePaperEvolutionModal();
    }
  }

  function renderCytoscapeGraph(data) {
    const container = document.getElementById('cy');
    if (!container || typeof cytoscape === 'undefined') return;

    const nodes = data ? (data.nodes || []) : [];
    const edges = data ? (data.edges || []) : [];

    if (nodes.length === 0) {
      if (cyInstance) { cyInstance.destroy(); cyInstance = null; }
      container.innerHTML = '<div style="display:flex; height:100%; align-items:center; justify-content:center; color:var(--text-soft); font-family:\'Space Grotesk\'; font-weight:600; font-size:14px; text-align:center; padding:20px;">Upload a PDF or enter a research topic above and click Analyze to generate the Citation Network.</div>';
      const nodesEl = document.getElementById('graphStatNodes');
      const edgesEl = document.getElementById('graphStatEdges');
      const topEl = document.getElementById('graphStatTop');
      if (nodesEl) nodesEl.textContent = '0 NODES';
      if (edgesEl) edgesEl.textContent = '0 EDGES';
      if (topEl) topEl.textContent = 'TOP: 0 CITES';
      return;
    }

    // Update live graph stats
    const maxCites = Math.max(...nodes.map(n => n.citation_count || 0), 0);
    const nodesEl = document.getElementById('graphStatNodes');
    const edgesEl = document.getElementById('graphStatEdges');
    const topEl = document.getElementById('graphStatTop');
    if (nodesEl) nodesEl.textContent = `${nodes.length} NODES`;
    if (edgesEl) edgesEl.textContent = `${edges.length} EDGES`;
    if (topEl) topEl.textContent = `TOP: ${maxCites.toLocaleString()} CITES`;

    const elements = [];

    nodes.forEach(n => {
      const count = n.citation_count || 0;
      let bgColor = '#FF6FB5'; // Red/Pink (<15)
      if (count >= 50) {
        bgColor = '#6BDE8F'; // Green (>=50)
      } else if (count >= 15) {
        bgColor = '#FFD166'; // Yellow (15-49)
      }

      const nodeSize = Math.round(34 + (Math.min(count, 1000) / 1000) * 38);

      elements.push({
        data: {
          id: n.id,
          label: n.title.length > 24 ? n.title.substring(0, 21) + '...' : n.title,
          fullTitle: n.title,
          authors: Array.isArray(n.authors) ? n.authors.join(', ') : (n.authors || 'Unknown'),
          year: n.year || 2023,
          journal: n.journal || 'Research Paper',
          citationCount: count,
          abstract: n.abstract || 'No abstract available.',
          keywords: n.keywords || [],
          doi: n.doi || 'N/A',
          url: n.url || '#',
          bgColor: bgColor,
          nodeSize: nodeSize
        }
      });
    });

    edges.forEach((e, idx) => {
      elements.push({
        data: {
          id: `edge_${idx}_${e.source}_${e.target}`,
          source: e.source,
          target: e.target
        }
      });
    });

    if (cyInstance) {
      cyInstance.destroy();
    }

    cyInstance = cytoscape({
      container: container,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(bgColor)',
            'width': 'data(nodeSize)',
            'height': 'data(nodeSize)',
            'border-width': 2.5,
            'border-color': '#15121F',
            'label': 'data(label)',
            'color': '#15121F',
            'font-family': 'Space Grotesk, sans-serif',
            'font-size': '11px',
            'font-weight': '700',
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'text-background-opacity': 0.85,
            'text-background-color': '#FFFFFF',
            'text-background-padding': '2px 4px',
            'text-background-shape': 'roundrectangle',
            'overlay-padding': '5px',
            'transition-property': 'opacity, border-color, border-width',
            'transition-duration': '0.2s'
          }
        },
        {
          selector: 'node.faded',
          style: {
            'opacity': 0.2
          }
        },
        {
          selector: 'node.highlighted',
          style: {
            'border-width': 4,
            'border-color': '#7C5CFC',
            'text-background-color': '#FFF3C4',
            'opacity': 1.0
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#A098BD',
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#15121F',
            'arrow-scale': 1.15,
            'opacity': 0.8,
            'transition-property': 'opacity, width, line-color',
            'transition-duration': '0.2s'
          }
        },
        {
          selector: 'edge.faded',
          style: {
            'opacity': 0.12
          }
        },
        {
          selector: 'edge.highlighted',
          style: {
            'width': 3.5,
            'line-color': '#7C5CFC',
            'target-arrow-color': '#7C5CFC',
            'opacity': 1.0
          }
        }
      ],
      layout: {
        name: currentLayoutName,
        animate: true,
        animationDuration: 1200,
        refresh: 20,
        fit: true,
        padding: 35,
        componentSpacing: 80,
        nodeOverlap: 25,
        idealEdgeLength: 100,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000
      }
    });

    const tooltip = document.getElementById('cy-tooltip');
    cyInstance.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      const pos = evt.renderedPosition;
      if (tooltip) {
        tooltip.innerHTML = `<strong>${escapeHtml(node.data('fullTitle'))}</strong><br><span style="font-size:11px; opacity:0.85;">${node.data('citationCount')} citations · ${node.data('year')}</span>`;
        tooltip.style.left = Math.min(pos.x + 15, container.clientWidth - 260) + 'px';
        tooltip.style.top = Math.max(pos.y - 10, 10) + 'px';
        tooltip.style.display = 'block';
      }
    });

    cyInstance.on('mouseout', 'node', () => {
      if (tooltip) tooltip.style.display = 'none';
    });

    // Tap node: Highlight neighborhood & show details
    cyInstance.on('tap', 'node', (evt) => {
      const node = evt.target;

      // Remove previous highlights/fades
      cyInstance.elements().removeClass('highlighted faded');

      // Highlight neighborhood
      const neighborhood = node.neighborhood().add(node);
      cyInstance.elements().difference(neighborhood).addClass('faded');
      neighborhood.addClass('highlighted');

      selectPaperNode(node.data());
    });

    // Tap canvas background: Reset highlight/fade filter
    cyInstance.on('tap', (evt) => {
      if (evt.target === cyInstance) {
        cyInstance.elements().removeClass('highlighted faded');
      }
    });

    if (nodes.length > 0) {
      const sorted = [...nodes].sort((a, b) => (b.citation_count || 0) - (a.citation_count || 0));
      const topNode = sorted[0];
      const cyTop = cyInstance.getElementById(topNode.id);
      if (cyTop) {
        selectPaperNode(cyTop.data());
      }
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function selectPaperNode(paperData) {
    const panel = document.getElementById('citation-info-panel');
    if (!panel) return;

    const count = paperData.citationCount || 0;
    let citeBadgeClass = 'badge-low';
    let citeLabel = 'Low Cited';
    if (count >= 50) {
      citeBadgeClass = 'badge-high';
      citeLabel = 'Highly Cited';
    } else if (count >= 15) {
      citeBadgeClass = 'badge-medium';
      citeLabel = 'Moderately Cited';
    }

    const keywordsHtml = (paperData.keywords || []).map(k => `<span class="keyword-badge">${escapeHtml(k)}</span>`).join('');
    const titleAttr = escapeHtml(paperData.fullTitle || '');

    const calendarSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="margin-right:4px; vertical-align:-2px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
    const venueSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="margin-right:4px; vertical-align:-2px;"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11"/></svg>`;

    panel.innerHTML = `
      <div>
        <div class="panel-section-title">SELECTED PAPER DETAILS</div>
        <h4 class="paper-detail-title">${escapeHtml(paperData.fullTitle || 'Untitled Paper')}</h4>
        
        <div class="paper-meta-row">
          <span class="badge-severity ${citeBadgeClass}">${citeLabel} (${count} Cites)</span>
          <span class="meta-pill">${calendarSvg}${paperData.year || 2023}</span>
          <span class="meta-pill">${venueSvg}${escapeHtml(paperData.journal || 'Venue')}</span>
        </div>

        <div style="font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 10px;">
          <strong>Authors:</strong> ${escapeHtml(paperData.authors || 'Unknown')}
        </div>

        <div style="font-size: 11.5px; font-family: 'IBM Plex Mono'; font-weight: 700; color: var(--purple); margin-bottom: 4px;">ABSTRACT</div>
        <div class="paper-abstract-box">${escapeHtml(paperData.abstract || 'No abstract content available.')}</div>

        <div style="font-size: 11.5px; font-family: 'IBM Plex Mono'; font-weight: 700; color: var(--purple); margin-bottom: 4px;">KEYWORDS</div>
        <div class="keywords-list">${keywordsHtml || '<span style="font-size:12px; color:var(--text-faint);">No keywords</span>'}</div>

        <div style="font-size: 12px; font-weight: 600; color: var(--text-soft); margin-bottom: 14px;">
          <strong>DOI / Link:</strong> <a href="${escapeHtml(paperData.url || '#')}" target="_blank" style="color: var(--purple); text-decoration: underline;">${escapeHtml(paperData.doi || 'Link')}</a>
        </div>
      </div>

      <button class="ask-rag-panel-btn" onclick="askRAGForPaper('${titleAttr.replace(/'/g, "\\'")}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Ask About Paper
      </button>
    `;
  }

  function askRAGForPaper(paperTitle) {
    const qaInput = document.getElementById('qaInput');
    const qaPanel = document.querySelector('.qa-panel');
    if (qaInput) {
      qaInput.value = `What are the key contributions and methodology of "${paperTitle}"?`;
      qaInput.focus();
    }
    if (qaPanel) {
      qaPanel.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function zoomGraph(factor) {
    if (!cyInstance) return;
    const currentZoom = cyInstance.zoom();
    cyInstance.zoom({
      level: currentZoom * factor,
      renderedPosition: { x: cyInstance.width() / 2, y: cyInstance.height() / 2 }
    });
  }

  function fitGraph() {
    if (!cyInstance) return;
    cyInstance.fit(35);
  }

  function setLayoutMode(layoutName) {
    currentLayoutName = layoutName;
    relayoutGraph();
  }

  function relayoutGraph() {
    if (!cyInstance) return;
    cyInstance.layout({
      name: currentLayoutName,
      animate: true,
      animationDuration: 1000,
      fit: true,
      padding: 35
    }).run();
  }

  window.addEventListener('DOMContentLoaded', () => {
    // Initial state: waiting for user input or PDF upload
  });
