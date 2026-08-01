
  let currentLineage = [];
  let currentDepth = 1;

  async function openIdeaExpansion(title, desc) {
    currentLineage = [title];
    currentDepth = 1;
    document.getElementById('modalParentTitle').textContent = title;
    document.getElementById('modalParentDesc').textContent = desc || '';
    document.getElementById('ideaModal').style.display = 'flex';
    await fetchExpandedIdeas(title, currentLineage, currentDepth);
  }

  async function expandSubIdea(subTitle, subDesc) {
    if (currentDepth >= 5) return;
    currentDepth += 1;
    currentLineage.push(subTitle);
    document.getElementById('modalParentTitle').textContent = subTitle;
    document.getElementById('modalParentDesc').textContent = subDesc || '';
    await fetchExpandedIdeas(subTitle, currentLineage, currentDepth);
  }

  async function jumpToDepth(idx) {
    if (idx < 0 || idx >= currentLineage.length) return;
    currentLineage = currentLineage.slice(0, idx + 1);
    currentDepth = currentLineage.length;
    const targetTitle = currentLineage[currentLineage.length - 1];
    document.getElementById('modalParentTitle').textContent = targetTitle;
    await fetchExpandedIdeas(targetTitle, currentLineage, currentDepth);
  }

  async function fetchExpandedIdeas(ideaTitle, lineage, depth) {
    const loading = document.getElementById('modalLoading');
    const childList = document.getElementById('modalChildList');
    const depthTag = document.getElementById('modalDepthTag');
    const breadcrumbs = document.getElementById('breadcrumbTrail');

    depthTag.textContent = `DEPTH ${depth} OF 5 · 5 RESEARCH DIMENSIONS`;
    breadcrumbs.innerHTML = lineage.map((item, i) => `
      <span onclick="jumpToDepth(${i})" style="cursor:pointer; text-decoration:${i === lineage.length - 1 ? 'underline' : 'none'}; font-weight:${i === lineage.length - 1 ? '700' : '500'};" title="Jump to Depth ${i+1}">
        ${escapeHtml(item)}
      </span>
    `).join(' &rarr; ');

    loading.style.display = 'block';
    childList.innerHTML = '';

    try {
      const resp = await fetch('/insights/ideas/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: ideaTitle, lineage: lineage, depth: depth, paper_id: currentPaperId })
      });
      const data = await resp.json();
      loading.style.display = 'none';

      if (data && data.child_ideas && Array.isArray(data.child_ideas)) {
        renderChildIdeas(data.child_ideas, depth);
      } else {
        childList.innerHTML = `<div style="padding:16px; color:var(--text-soft); font-weight:600;">No further child dimensions returned.</div>`;
      }
    } catch (err) {
      loading.style.display = 'none';
      childList.innerHTML = `<div style="padding:16px; color:red; font-weight:600;">Error expanding idea: ${escapeHtml(err.message)}</div>`;
    }
  }

  function renderChildIdeas(children, depth) {
    const childList = document.getElementById('modalChildList');
    const isMaxDepth = depth >= 5;

    childList.innerHTML = children.map((c, i) => {
      const titleEsc = escapeHtml(c.title || `Dimension ${i+1}`);
      const descEsc = escapeHtml(c.description || c.research_question || '');
      
      return `
        <div ${!isMaxDepth ? `onclick="expandSubIdea('${titleEsc.replace(/'/g, "\\'")}', '${descEsc.replace(/'/g, "\\'")}')"` : ''} 
             style="background: var(--paper); border: 2px solid var(--ink); border-radius: 14px; padding: 16px; box-shadow: 4px 4px 0px var(--ink); ${!isMaxDepth ? 'cursor: pointer;' : ''} transition: transform .15s;" 
             ${!isMaxDepth ? `onmouseover="this.style.transform='translate(-2px,-2px)'" onmouseout="this.style.transform='none'"` : ''}>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-family:'IBM Plex Mono'; font-size: 10px; font-weight:700; background: var(--pastel-purple); color: var(--purple); padding: 2px 8px; border-radius: 6px; border: 1px solid var(--ink); text-transform: uppercase;">
              ${escapeHtml(c.category || `DIMENSION ${i+1}`)}
            </span>
            <span style="font-family:'IBM Plex Mono'; font-size: 10.5px; font-weight: 700; color: var(--ink);">
              NOVELTY: ${c.novelty || 80}%
            </span>
          </div>
          <h5 style="font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 6px;">
            ${titleEsc}
          </h5>
          <p style="font-size: 13px; color: var(--text-soft); font-weight: 500; margin-bottom: 10px;">
            ${descEsc}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between; font-family: 'IBM Plex Mono'; font-size: 11px; font-weight: 700;">
            <span style="color: var(--text-soft);">DIFF: ${escapeHtml(c.difficulty || 'Medium')} · IMPACT: ${escapeHtml(c.impact || 'High')}</span>
            ${!isMaxDepth ? `
              <span style="width: 28px; height: 28px; min-width: 28px; min-height: 28px; flex-shrink: 0; border-radius: 50%; background: var(--pastel-purple); border: 1.5px solid var(--ink); display: inline-flex; align-items: center; justify-content: center; box-shadow: 2px 2px 0px var(--ink); color: var(--ink);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </span>
            ` : `
              <span style="font-size: 10px; color: var(--text-faint);">MAX DEPTH 5</span>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  function closeIdeaModal() {
    const modal = document.getElementById('ideaModal');
    if (modal) modal.style.display = 'none';
  }

  function handleIdeaModalBackdrop(e) {
    if (e.target.id === 'ideaModal') {
      closeIdeaModal();
    }
  }

  // ---------- AI Research Notes Module ----------
  let activeNotesData = null;
  let isNotesEditMode = false;
  let lastAnalysisData = null;

  async function handleCollectNotesClick() {
    const modal = document.getElementById('notesWorkspaceModal');
    if (modal) modal.style.display = 'flex';

    const topicVal = document.getElementById('topicInput') ? document.getElementById('topicInput').value.trim() : '';
    const projId = currentPaperId || (topicVal ? `topic:${topicVal.toLowerCase()}` : 'default_project');

    // 1. Check local/backend cache first
    try {
      const resp = await fetch(`/notes/${encodeURIComponent(projId)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.notes) {
          activeNotesData = data;
          isNotesEditMode = false;
          renderNotesContainer();
          return;
        }
      }
    } catch (e) {
      console.warn("Failed fetching saved notes:", e);
    }

    // 2. If no saved notes, trigger automatic generation
    await generateNotesFromCurrentAnalysis(projId);
  }

  async function generateNotesFromCurrentAnalysis(projId) {
    const loadingState = document.getElementById('notesLoadingState');
    const displayContainer = document.getElementById('notesDisplayContainer');
    
    if (loadingState) loadingState.style.display = 'block';
    if (displayContainer) displayContainer.style.display = 'none';

    const topicVal = document.getElementById('topicInput') ? document.getElementById('topicInput').value.trim() : '';
    const topic = topicVal || (currentPaperId ? 'Uploaded Document' : 'Research Topic');
    
    // Harvest analysis data if not in memory
    const analysisPayload = lastAnalysisData || {
      summary: document.getElementById('resultSummary') ? document.getElementById('resultSummary').textContent : '',
      findings: Array.from(document.querySelectorAll('#findingsList .finding-card')).map(el => el.textContent.trim()),
      gaps: Array.from(document.querySelectorAll('#gapsGrid .gap-card')).map(el => el.textContent.trim()),
      ideas: Array.from(document.querySelectorAll('#ideasGrid .idea-card')).map(el => el.textContent.trim())
    };

    try {
      const resp = await fetch('/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic,
          paper_id: currentPaperId,
          analysis_data: analysisPayload
        })
      });

      if (!resp.ok) throw new Error('Notes generation API failed');
      const data = await resp.json();
      activeNotesData = data;
      isNotesEditMode = false;

      // Save to localStorage for quick restore
      if (projId) localStorage.setItem(`paperdeck_notes_${projId}`, JSON.stringify(data));
      
      if (loadingState) loadingState.style.display = 'none';
      if (displayContainer) displayContainer.style.display = 'block';
      renderNotesContainer();
    } catch (err) {
      console.error("Notes generation error:", err);
      if (loadingState) loadingState.style.display = 'none';
      if (displayContainer) {
        displayContainer.style.display = 'block';
        displayContainer.innerHTML = `<div style="padding: 20px; color: red; font-weight: 700;">Failed generating notes: ${escapeHtml(err.message)}</div>`;
      }
    }
  }

  function renderNotesContainer() {
    const displayContainer = document.getElementById('notesDisplayContainer');
    const modeBadge = document.getElementById('notesModeBadge');
    const editBtnText = document.getElementById('notesEditBtnText');

    if (!displayContainer || !activeNotesData || !activeNotesData.notes) return;
    const n = activeNotesData.notes;

    if (isNotesEditMode) {
      modeBadge.textContent = 'EDIT MODE (AUTO-SAVE)';
      modeBadge.className = 'badge-severity badge-high';
      if (editBtnText) editBtnText.textContent = 'Done';
      
      // Render Edit Mode Text Inputs & Textareas
      displayContainer.innerHTML = `
        <div style="margin-bottom: 20px;">
          <label style="font-family:'Space Grotesk'; font-size:12px; font-weight:700; color:var(--text-soft); text-transform:uppercase;">Notebook Title</label>
          <input type="text" id="notesEditTitle" value="${escapeHtml(n.title || '')}" 
                 style="width: 100%; font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 700; border: 2px solid var(--ink); border-radius: 10px; padding: 10px 14px; margin-top: 4px; box-shadow: 2px 2px 0px var(--ink);">
        </div>

        <div style="margin-bottom: 20px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <label style="font-family:'Space Grotesk'; font-size:12px; font-weight:700; color:var(--text-soft); text-transform:uppercase;">Notebook Sections</label>
            <button onclick="addNotesSectionInput()" style="padding: 4px 10px; border-radius: 8px; border: 1.5px solid var(--ink); background: var(--pastel-yellow); font-family:'Space Grotesk'; font-weight:700; font-size:11px; cursor:pointer; box-shadow: 2px 2px 0px var(--ink);">+ Add Section</button>
          </div>
          <div id="notesEditSectionsContainer" style="display: flex; flex-direction: column; gap: 14px;">
            ${(n.sections || []).map((sec, idx) => `
              <div style="background: var(--paper); border: 2px solid var(--ink); border-radius: 12px; padding: 14px; box-shadow: 3px 3px 0px var(--ink); position: relative;">
                <button onclick="removeNotesSectionInput(${idx})" style="position: absolute; top: 10px; right: 10px; border-radius: 50%; border: 1px solid var(--ink); background: var(--pastel-pink); font-size: 10px; font-weight: 700; width: 22px; height: 22px; cursor: pointer;">✕</button>
                <input type="text" class="notes-sec-heading" value="${escapeHtml(sec.heading || '')}" placeholder="Section Heading"
                       style="width: 85%; font-family: 'Space Grotesk', sans-serif; font-size: 14.5px; font-weight: 700; border: 1.5px solid var(--ink); border-radius: 8px; padding: 6px 10px; margin-bottom: 8px;">
                <textarea class="notes-sec-content" rows="4" placeholder="Section Content..."
                          style="width: 100%; font-family: sans-serif; font-size: 13.5px; border: 1.5px solid var(--ink); border-radius: 8px; padding: 8px 10px; resize: vertical;">${escapeHtml(sec.content || '')}</textarea>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <label style="font-family:'Space Grotesk'; font-size:12px; font-weight:700; color:var(--text-soft); text-transform:uppercase;">Key Takeaways (One per line)</label>
          <textarea id="notesEditTakeaways" rows="4" 
                    style="width: 100%; font-family: sans-serif; font-size: 13.5px; border: 2px solid var(--ink); border-radius: 10px; padding: 10px; margin-top: 4px; box-shadow: 2px 2px 0px var(--ink); resize: vertical;">${(n.key_takeaways || []).join('\n')}</textarea>
        </div>

        <div style="margin-bottom: 20px;">
          <label style="font-family:'Space Grotesk'; font-size:12px; font-weight:700; color:var(--text-soft); text-transform:uppercase;">Future Research Directions (One per line)</label>
          <textarea id="notesEditDirections" rows="4" 
                    style="width: 100%; font-family: sans-serif; font-size: 13.5px; border: 2px solid var(--ink); border-radius: 10px; padding: 10px; margin-top: 4px; box-shadow: 2px 2px 0px var(--ink); resize: vertical;">${(n.future_research_directions || []).join('\n')}</textarea>
        </div>
      `;
    } else {
      modeBadge.textContent = 'READ MODE';
      modeBadge.className = 'badge-severity badge-low';
      if (editBtnText) editBtnText.textContent = 'Edit';

      // Render Read Mode Formatted View
      displayContainer.innerHTML = `
        <div style="margin-bottom: 20px; padding-bottom: 14px; border-bottom: 2.5px solid var(--ink);">
          <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 700; color: var(--ink); margin-bottom: 4px;">
            ${escapeHtml(n.title || 'Structured Research Notebook')}
          </h2>
          <span style="font-family:'IBM Plex Mono'; font-size:11px; font-weight:700; color:var(--purple); background:var(--pastel-purple); padding:3px 10px; border-radius:6px; border:1px solid var(--ink);">
            HYBRID NOTEBOOK STRUCTURE (CORNELL + ZETTELKASTEN)
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 22px;">
          ${(n.sections || []).map(sec => `
            <div style="background: #ffffff; border: 2px solid var(--ink); border-radius: 16px; padding: 18px; box-shadow: 4px 4px 0px var(--ink);">
              <h4 style="font-family: 'Space Grotesk', sans-serif; font-size: 16.5px; font-weight: 700; color: var(--ink); margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--yellow); border: 1.5px solid var(--ink);"></span>
                ${escapeHtml(sec.heading || 'Notebook Section')}
              </h4>
              <div style="font-size: 13.5px; color: var(--ink); line-height: 1.6; white-space: pre-wrap; font-weight: 450;">
                ${escapeHtml(sec.content || '')}
              </div>
            </div>
          `).join('')}
        </div>

        ${n.key_takeaways && n.key_takeaways.length > 0 ? `
          <div style="background: var(--pastel-yellow); border: 2px solid var(--ink); border-radius: 16px; padding: 18px; box-shadow: 4px 4px 0px var(--ink); margin-bottom: 18px;">
            <h4 style="font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
              Key Takeaways & Core Concepts
            </h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 13.5px; color: var(--ink); line-height: 1.6; font-weight: 500;">
              ${n.key_takeaways.map(t => `<li style="margin-bottom: 6px;">${escapeHtml(t)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${n.future_research_directions && n.future_research_directions.length > 0 ? `
          <div style="background: var(--pastel-blue); border: 2px solid var(--ink); border-radius: 16px; padding: 18px; box-shadow: 4px 4px 0px var(--ink);">
            <h4 style="font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
              Future Research Directions
            </h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 13.5px; color: var(--ink); line-height: 1.6; font-weight: 500;">
              ${n.future_research_directions.map(d => `<li style="margin-bottom: 6px;">${escapeHtml(d)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      `;
    }
  }

  function addNotesSectionInput() {
    if (!activeNotesData || !activeNotesData.notes) return;
    if (!activeNotesData.notes.sections) activeNotesData.notes.sections = [];
    activeNotesData.notes.sections.push({ heading: "New Section", content: "" });
    renderNotesContainer();
  }

  function removeNotesSectionInput(idx) {
    if (!activeNotesData || !activeNotesData.notes || !activeNotesData.notes.sections) return;
    activeNotesData.notes.sections.splice(idx, 1);
    renderNotesContainer();
  }

  async function toggleNotesEditMode() {
    if (isNotesEditMode) {
      // Collect Edits into activeNotesData
      const titleInput = document.getElementById('notesEditTitle');
      const takeawaysInput = document.getElementById('notesEditTakeaways');
      const directionsInput = document.getElementById('notesEditDirections');

      const headings = Array.from(document.querySelectorAll('.notes-sec-heading')).map(el => el.value);
      const contents = Array.from(document.querySelectorAll('.notes-sec-content')).map(el => el.value);

      const sections = headings.map((h, i) => ({ heading: h, content: contents[i] || '' }));
      const keyTakeaways = takeawaysInput ? takeawaysInput.value.split('\n').map(s => s.trim()).filter(Boolean) : [];
      const futureDirections = directionsInput ? directionsInput.value.split('\n').map(s => s.trim()).filter(Boolean) : [];

      activeNotesData = {
        notes: {
          title: titleInput ? titleInput.value.trim() : 'Research Notebook',
          sections: sections,
          key_takeaways: keyTakeaways,
          future_research_directions: futureDirections
        }
      };

      // Save to persistence
      const topicVal = document.getElementById('topicInput') ? document.getElementById('topicInput').value.trim() : '';
      const projId = currentPaperId || (topicVal ? `topic:${topicVal.toLowerCase()}` : 'default_project');
      try {
        await fetch(`/notes/${encodeURIComponent(projId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: activeNotesData })
        });
      } catch (e) { console.warn("Failed saving notes:", e); }

      isNotesEditMode = false;
      renderNotesContainer();
    } else {
      isNotesEditMode = true;
      renderNotesContainer();
    }
  }

  async function triggerNotesRefine() {
    if (!activeNotesData || !activeNotesData.notes) return;

    const loadingState = document.getElementById('notesLoadingState');
    const displayContainer = document.getElementById('notesDisplayContainer');
    const loadingText = document.getElementById('notesLoadingText');

    if (loadingText) loadingText.textContent = 'Refining Notes with AI...';
    if (loadingState) loadingState.style.display = 'block';
    if (displayContainer) displayContainer.style.display = 'none';

    try {
      const resp = await fetch('/refine-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: activeNotesData })
      });

      if (!resp.ok) throw new Error('Refine notes API failed');
      const refinedData = await resp.json();

      if (refinedData && refinedData.notes) {
        activeNotesData = refinedData;
        const topicVal = document.getElementById('topicInput') ? document.getElementById('topicInput').value.trim() : '';
        const projId = currentPaperId || (topicVal ? `topic:${topicVal.toLowerCase()}` : 'default_project');
        try {
          await fetch(`/notes/${encodeURIComponent(projId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: activeNotesData })
          });
        } catch (e) {}
      }
    } catch (err) {
      console.error("Refinement error:", err);
    } finally {
      if (loadingState) loadingState.style.display = 'none';
      if (displayContainer) displayContainer.style.display = 'block';
      isNotesEditMode = false;
      renderNotesContainer();
    }
  }

  function copyNotesToClipboard() {
    if (!activeNotesData || !activeNotesData.notes) return;
    const n = activeNotesData.notes;

    let text = `# ${n.title || 'Research Notebook'}\n\n`;
    (n.sections || []).forEach(sec => {
      text += `## ${sec.heading}\n${sec.content}\n\n`;
    });
    if (n.key_takeaways && n.key_takeaways.length > 0) {
      text += `## Key Takeaways\n`;
      n.key_takeaways.forEach(t => text += `- ${t}\n`);
      text += `\n`;
    }
    if (n.future_research_directions && n.future_research_directions.length > 0) {
      text += `## Future Research Directions\n`;
      n.future_research_directions.forEach(d => text += `- ${d}\n`);
    }

    navigator.clipboard.writeText(text).then(() => {
      const toast = document.getElementById('notesToast');
      if (toast) {
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 2500);
      }
    }).catch(err => {
      alert("Failed copying notes to clipboard: " + err);
    });
  }

  function exportNotesPdf() {
    if (!activeNotesData || !activeNotesData.notes) return;
    const n = activeNotesData.notes;

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert("Please allow popups to export PDF");
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${escapeHtml(n.title || 'Research Notebook')}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #15121F; line-height: 1.6; }
          h1 { font-size: 26px; border-bottom: 2px solid #15121F; padding-bottom: 10px; margin-bottom: 20px; }
          h2 { font-size: 18px; margin-top: 24px; color: #15121F; }
          .section-card { border: 1.5px solid #15121F; border-radius: 10px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; }
          ul { padding-left: 20px; }
          li { margin-bottom: 6px; }
          .footer { margin-top: 40px; font-size: 11px; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(n.title || 'Research Notebook')}</h1>
        <div>
          ${(n.sections || []).map(sec => `
            <div class="section-card">
              <h2>${escapeHtml(sec.heading)}</h2>
              <p>${escapeHtml(sec.content).replace(/\\n/g, '<br>')}</p>
            </div>
          `).join('')}
        </div>
        ${n.key_takeaways ? `
          <div class="section-card" style="background:#fffde7;">
            <h2>Key Takeaways</h2>
            <ul>${n.key_takeaways.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
          </div>
        ` : ''}
        ${n.future_research_directions ? `
          <div class="section-card" style="background:#e3f2fd;">
            <h2>Future Research Directions</h2>
            <ul>${n.future_research_directions.map(d => `<li>${escapeHtml(d)}</li>`).join('')}</ul>
          </div>
        ` : ''}
        <div class="footer">Generated by PaperDeck AI Research Assistant — Team James</div>
        <script>
          window.onload = function() { window.print(); }
        <\/script>
      </body>
      </html>
    `);
    printWin.document.close();
  }

  function closeNotesWorkspaceModal() {
    const modal = document.getElementById('notesWorkspaceModal');
    if (modal) modal.style.display = 'none';
  }

  function handleNotesModalBackdrop(e) {
    if (e.target.id === 'notesWorkspaceModal') {
      closeNotesWorkspaceModal();
    }
  }

  // ESC key support for closing modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePaperEvolutionModal();
      closeIdeaModal();
      closeNotesWorkspaceModal();
    }
  });

  window.addEventListener('DOMContentLoaded', () => {
    // Page load setup
  });
