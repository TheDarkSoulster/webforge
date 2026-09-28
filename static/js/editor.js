let project = null;
let currentPageId = null;
let selectedComponentId = null;
let undoStack = [];
let redoStack = [];
let isPreview = false;

function generateId() { return 'id_' + Math.random().toString(36).substr(2, 9); }

const ComponentDefs = {
  heading: { name: 'Heading', create: () => ({ id: generateId(), type: 'heading', properties: { text: 'New Heading', size: 'h2', align: 'left', color: 'var(--text)', weight: 'bold' } }) },
  text: { name: 'Text', create: () => ({ id: generateId(), type: 'text', properties: { text: 'Lorem ipsum dolor sit amet.', align: 'left', color: 'var(--text)', size: '16px' } }) },
  button: { name: 'Button', create: () => ({ id: generateId(), type: 'button', properties: { text: 'Click Me', url: '#', bgColor: 'var(--primary)', textColor: '#ffffff', borderRadius: 'var(--radius)', align: 'left', padding: '12px 24px' } }) },
  image: { name: 'Image', create: () => ({ id: generateId(), type: 'image', properties: { url: 'https://via.placeholder.com/800x400', alt: 'Placeholder', width: '100%', height: 'auto', borderRadius: '0px', objectFit: 'cover', align: 'center' } }) },
  hero: { name: 'Hero', create: () => ({ id: generateId(), type: 'hero', properties: { title: 'Welcome', subtitle: 'This is a hero section.', buttonText: 'Get Started', buttonUrl: '#', align: 'center', bgColor: 'var(--background)', textColor: 'var(--text)', minHeight: '400px' } }) },
  card: { name: 'Card', create: () => ({ id: generateId(), type: 'card', properties: { title: 'Card Title', description: 'Description text.', buttonText: 'Learn More', buttonUrl: '#', bg: '#ffffff', border: '1px solid #e5e5e5', borderRadius: 'var(--radius)' } }) },
  navbar: { name: 'Navbar', create: () => ({ id: generateId(), type: 'navbar', properties: { logoText: 'Logo', links: 'Home|/,Contact|/contact.html', bgColor: 'var(--background)', textColor: 'var(--text)' } }) },
  footer: { name: 'Footer', create: () => ({ id: generateId(), type: 'footer', properties: { text: '© 2026 My Website', bgColor: 'var(--background)', textColor: 'var(--text)' } }) },
  divider: { name: 'Divider', create: () => ({ id: generateId(), type: 'divider', properties: { color: '#e5e5e5', thickness: '1px', margin: '20px 0' } }) },
  spacer: { name: 'Spacer', create: () => ({ id: generateId(), type: 'spacer', properties: { height: '50px' } }) },
  twocolumn: { name: 'Two Column', create: () => ({ id: generateId(), type: 'twocolumn', properties: { gap: '20px' }, slots: { col1: [], col2: [] } }) },
  threecolumn: { name: 'Three Column', create: () => ({ id: generateId(), type: 'threecolumn', properties: { gap: '20px' }, slots: { col1: [], col2: [], col3: [] } }) }
};

const propConfig = {
  text: 'text', size: 'text', align: ['left', 'center', 'right'], color: 'color', weight: ['normal', 'bold'],
  url: 'text', bgColor: 'color', textColor: 'color', borderRadius: 'text', padding: 'text',
  alt: 'text', width: 'text', height: 'text', objectFit: ['cover', 'contain'],
  title: 'text', subtitle: 'textarea', buttonText: 'text', buttonUrl: 'text', minHeight: 'text',
  description: 'textarea', bg: 'color', border: 'text', thickness: 'text', margin: 'text',
  logoText: 'text', links: 'textarea', gap: 'text'
};

// Initialize
fetch('/api/projects/' + projectId).then(r=>r.json()).then(data => {
  project = data;
  document.getElementById('project-name').textContent = project.name;
  currentPageId = project.pages.find(p => p.isHome).id;
  updateGlobalStyles();
  renderPageSelector();
  renderSidebar();
  renderCanvas();
});

function pushHistory() {
  undoStack.push(JSON.stringify(project));
  if(undoStack.length > 50) undoStack.shift();
  redoStack = [];
  triggerAutosave();
}
function undo() {
  if (undoStack.length > 0) {
    redoStack.push(JSON.stringify(project));
    project = JSON.parse(undoStack.pop());
    selectedComponentId = null;
    renderPageSelector(); renderCanvas(); renderProperties(); triggerAutosave();
  }
}
function redo() {
  if (redoStack.length > 0) {
    undoStack.push(JSON.stringify(project));
    project = JSON.parse(redoStack.pop());
    selectedComponentId = null;
    renderPageSelector(); renderCanvas(); renderProperties(); triggerAutosave();
  }
}

let saveTimeout;
function triggerAutosave() {
  document.getElementById('save-status').textContent = 'Saving...';
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    fetch('/api/projects/' + projectId, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(project) })
      .then(()=> {
        document.getElementById('save-status').textContent = 'Saved';
        setTimeout(() => document.getElementById('save-status').textContent = '', 2000);
      });
  }, 1000);
}

function updateGlobalStyles() {
  let styleEl = document.getElementById('wb-global-styles');
  if(!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'wb-global-styles'; document.head.appendChild(styleEl); }
  const s = project.settings;
  styleEl.textContent = `.canvas-wrapper { --primary: ${s.primaryColor}; --secondary: ${s.secondaryColor}; --background: ${s.backgroundColor}; --text: ${s.textColor}; --radius: ${s.borderRadius}; --font: ${s.fontFamily}; font-family: var(--font); background-color: var(--background); color: var(--text); line-height: 1.5; }`;
}

function renderSidebar() {
  const list = document.getElementById('components-list');
  list.innerHTML = '';
  Object.keys(ComponentDefs).forEach(key => {
    const div = document.createElement('div');
    div.className = 'component-item';
    div.draggable = true;
    div.textContent = ComponentDefs[key].name;
    div.addEventListener('dragstart', e => {
      e.dataTransfer.setData('application/json', JSON.stringify({source: 'sidebar', type: key}));
    });
    // Click to append
    div.addEventListener('click', () => {
        pushHistory();
        project.pages.find(p=>p.id===currentPageId).components.push(ComponentDefs[key].create());
        renderCanvas();
    });
    list.appendChild(div);
  });
}

function renderPageSelector() {
  const sel = document.getElementById('page-selector');
  sel.innerHTML = '';
  project.pages.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    if(p.id === currentPageId) opt.selected = true;
    sel.appendChild(opt);
  });
}
function switchPage(id) { currentPageId = id; selectedComponentId = null; renderCanvas(); renderProperties(); }

// Component Rendering
function renderComponentNode(comp) {
  const wrapper = document.createElement('div');
  wrapper.className = 'wb-component-wrapper';
  wrapper.dataset.id = comp.id;
  wrapper.draggable = !isPreview;

  wrapper.addEventListener('click', (e) => { e.stopPropagation(); if(!isPreview) selectComponent(comp.id); });
  wrapper.addEventListener('dragstart', (e) => {
    if(isPreview) return;
    e.stopPropagation();
    e.dataTransfer.setData('application/json', JSON.stringify({source: 'canvas', id: comp.id}));
    setTimeout(()=> wrapper.classList.add('dragging'), 0);
  });
  wrapper.addEventListener('dragend', () => wrapper.classList.remove('dragging'));

  const inner = document.createElement('div');
  if(!comp.slots) inner.style.pointerEvents = isPreview ? 'auto' : 'none';
  
  const p = comp.properties;
  if(comp.type === 'heading') {
    const h = document.createElement(p.size); h.textContent = p.text;
    h.style.cssText = `text-align:${p.align}; color:${p.color}; font-weight:${p.weight}; margin-top:0;`;
    inner.appendChild(h);
  } else if(comp.type === 'text') {
    const t = document.createElement('p'); t.textContent = p.text;
    t.style.cssText = `text-align:${p.align}; color:${p.color}; font-size:${p.size}; white-space:pre-wrap;`;
    inner.appendChild(t);
  } else if(comp.type === 'button') {
    inner.style.textAlign = p.align; inner.style.margin = '10px 0';
    const b = document.createElement('a'); b.textContent = p.text; b.href = 'javascript:void(0)';
    b.style.cssText = `background-color:${p.bgColor}; color:${p.textColor}; border-radius:${p.borderRadius}; padding:${p.padding}; display:inline-block; text-decoration:none; cursor:pointer; opacity:1;`;
    inner.appendChild(b);
  } else if(comp.type === 'image') {
    inner.style.textAlign = p.align;
    const img = document.createElement('img'); img.src = p.url; img.alt = p.alt;
    img.style.cssText = `width:${p.width}; height:${p.height}; border-radius:${p.borderRadius}; object-fit:${p.objectFit}; max-width:100%;`;
    inner.appendChild(img);
  } else if(comp.type === 'hero') {
    const flexAlign = p.align === 'center' ? 'center' : (p.align === 'right' ? 'flex-end' : 'flex-start');
    inner.style.cssText = `min-height:${p.minHeight}; background-color:${p.bgColor}; color:${p.textColor}; display:flex; flex-direction:column; justify-content:center; align-items:${flexAlign}; text-align:${p.align}; padding:60px 20px;`;
    inner.innerHTML = `<h1 style="font-size:48px;margin:0 0 16px 0;">${p.title}</h1><p style="font-size:20px;margin:0;opacity:0.9;">${p.subtitle}</p>`;
    if(p.buttonText) inner.innerHTML += `<div style="margin-top:16px;"><span style="background-color:var(--primary);color:#fff;padding:12px 24px;border-radius:var(--radius);display:inline-block;">${p.buttonText}</span></div>`;
  } else if(comp.type === 'card') {
    inner.style.cssText = `background:${p.bg}; border:${p.border}; border-radius:${p.borderRadius}; padding:24px; display:flex; flex-direction:column;`;
    inner.innerHTML = `<h3 style="margin-top:0;">${p.title}</h3><p style="flex-grow:1;opacity:0.8;">${p.description}</p>`;
    if(p.buttonText) inner.innerHTML += `<div style="margin-top:16px;"><span style="background-color:var(--primary);color:#fff;padding:10px 20px;border-radius:var(--radius);display:inline-block;">${p.buttonText}</span></div>`;
  } else if(comp.type === 'divider') {
    inner.innerHTML = `<hr style="border:none; border-top:${p.thickness} solid ${p.color}; margin:${p.margin};" />`;
  } else if(comp.type === 'spacer') {
    inner.style.cssText = `height:${p.height}; width:100%;`;
  } else if(comp.type === 'navbar') {
    const linksHtml = p.links.split(',').filter(l=>l.trim()).map(l => `<a href="javascript:void(0)" style="color:${p.textColor}; text-decoration:none;">${l.split('|')[0].trim()}</a>`).join('');
    inner.style.cssText = `background-color:${p.bgColor}; color:${p.textColor}; display:flex; justify-content:space-between; align-items:center; padding:16px 24px; border-bottom:1px solid rgba(0,0,0,0.05);`;
    inner.innerHTML = `<div style="font-weight:bold;font-size:24px;">${p.logoText}</div><div style="display:flex;gap:16px;">${linksHtml}</div>`;
  } else if(comp.type === 'footer') {
    inner.style.cssText = `background-color:${p.bgColor}; color:${p.textColor}; padding:24px; text-align:center;`;
    inner.textContent = p.text;
  } else if(comp.type === 'twocolumn' || comp.type === 'threecolumn') {
    inner.style.cssText = `display:flex; gap:${p.gap}; flex-wrap:wrap; width:100%;`;
    Object.keys(comp.slots).forEach(slotName => {
      const col = document.createElement('div');
      col.style.cssText = `flex:1; min-width:250px;`;
      if(!isPreview) {
        col.classList.add('wb-dropzone');
        col.dataset.slot = slotName; col.dataset.parentId = comp.id;
        col.style.border = '1px dashed transparent';
      }
      comp.slots[slotName].forEach(child => col.appendChild(renderComponentNode(child)));
      if(!isPreview && comp.slots[slotName].length === 0) {
        col.innerHTML = `<div style="padding:20px;text-align:center;color:#9ca3af;border:1px dashed #d1d5db;border-radius:4px;">Drop here</div>`;
      }
      inner.appendChild(col);
    });
  }

  wrapper.appendChild(inner);

  if (selectedComponentId === comp.id && !isPreview) {
    wrapper.classList.add('selected');
    const controls = document.createElement('div');
    controls.className = 'wb-controls';
    controls.innerHTML = `
      <button onclick="moveUp('${comp.id}', event)" title="Move Up">↑</button>
      <button onclick="moveDown('${comp.id}', event)" title="Move Down">↓</button>
      <button onclick="duplicateComponent('${comp.id}', event)" title="Duplicate">⧉</button>
      <button onclick="deleteComponent('${comp.id}', event)" title="Delete">🗑</button>
    `;
    wrapper.appendChild(controls);
  }
  return wrapper;
}

function renderCanvas() {
  const canvas = document.getElementById('canvas');
  canvas.innerHTML = '';
  const page = project.pages.find(p => p.id === currentPageId);
  if(!page) return;
  page.components.forEach(comp => canvas.appendChild(renderComponentNode(comp)));
  if (page.components.length === 0 && !isPreview) {
    canvas.innerHTML = `<div style="padding:60px;text-align:center;color:#9ca3af;border:2px dashed #d1d5db;border-radius:8px;margin:20px;">Drag components here to start building</div>`;
  }
  setupDropzones();
}

// Drag & Drop
function setupDropzones() {
  document.querySelectorAll('.wb-dropzone').forEach(zone => {
    zone.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', e => { e.preventDefault(); e.stopPropagation(); zone.classList.remove('drag-over'); });
    zone.addEventListener('drop', e => {
      e.preventDefault(); e.stopPropagation(); zone.classList.remove('drag-over');
      const dataStr = e.dataTransfer.getData('application/json');
      if(!dataStr) return;
      const data = JSON.parse(dataStr);
      pushHistory();
      
      let newComp;
      if (data.source === 'sidebar') newComp = ComponentDefs[data.type].create();
      else if (data.source === 'canvas') {
        const loc = findComponent(data.id);
        if(!loc) return;
        newComp = loc.comp;
        loc.array.splice(loc.index, 1);
      }

      let targetArray = zone.dataset.slot === 'main' ? project.pages.find(p=>p.id===currentPageId).components : findComponent(zone.dataset.parentId).comp.slots[zone.dataset.slot];
      
      const afterElement = getDragAfterElement(zone, e.clientY);
      if (afterElement == null) targetArray.push(newComp);
      else targetArray.splice(targetArray.findIndex(c => c.id === afterElement.dataset.id), 0, newComp);
      
      selectedComponentId = newComp.id;
      renderCanvas(); renderProperties();
    });
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll(':scope > .wb-component-wrapper:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
    else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Component Actions
function findComponent(id, components = project.pages.find(p => p.id === currentPageId).components) {
  for (let i = 0; i < components.length; i++) {
    if (components[i].id === id) return { array: components, index: i, comp: components[i] };
    if (components[i].slots) {
      for (const slot in components[i].slots) {
        const res = findComponent(id, components[i].slots[slot]);
        if (res) return res;
      }
    }
  }
  return null;
}

function selectComponent(id) { selectedComponentId = id; renderCanvas(); renderProperties(); }
function deleteComponent(id, e) { if(e) e.stopPropagation(); pushHistory(); const loc = findComponent(id); if(loc) { loc.array.splice(loc.index, 1); if(selectedComponentId===id) selectedComponentId=null; renderCanvas(); renderProperties(); } }
function duplicateComponent(id, e) {
  if(e) e.stopPropagation(); const loc = findComponent(id);
  if(loc) {
    pushHistory(); const copy = JSON.parse(JSON.stringify(loc.comp));
    const resetIds = c => { c.id = generateId(); if(c.slots) Object.values(c.slots).forEach(arr=>arr.forEach(resetIds)); };
    resetIds(copy);
    loc.array.splice(loc.index + 1, 0, copy); renderCanvas();
  }
}
function moveUp(id, e) { e.stopPropagation(); const loc = findComponent(id); if(loc && loc.index > 0) { pushHistory(); [loc.array[loc.index], loc.array[loc.index-1]] = [loc.array[loc.index-1], loc.array[loc.index]]; renderCanvas(); } }
function moveDown(id, e) { e.stopPropagation(); const loc = findComponent(id); if(loc && loc.index < loc.array.length-1) { pushHistory(); [loc.array[loc.index], loc.array[loc.index+1]] = [loc.array[loc.index+1], loc.array[loc.index]]; renderCanvas(); } }

// Properties
function renderProperties() {
  const panel = document.getElementById('properties-content');
  if(!selectedComponentId) { panel.innerHTML = '<div class="empty-props">Select a component to edit its properties.</div>'; return; }
  const loc = findComponent(selectedComponentId);
  if(!loc) return;
  const comp = loc.comp;
  panel.innerHTML = `<h4 style="margin-top:0;margin-bottom:16px;color:#374151;">${ComponentDefs[comp.type].name} Settings</h4>`;
  
  Object.keys(comp.properties).forEach(key => {
    const config = propConfig[key];
    const val = comp.properties[key];
    const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
    const div = document.createElement('div'); div.className = 'prop-group';
    div.innerHTML = `<label>${label}</label>`;
    
    let input;
    if(Array.isArray(config)) {
      input = document.createElement('select');
      config.forEach(o => { const opt = document.createElement('option'); opt.value = o; opt.textContent = o; if(val===o) opt.selected = true; input.appendChild(opt); });
    } else if(config === 'textarea') {
      input = document.createElement('textarea'); input.value = val; input.rows = 3;
    } else {
      input = document.createElement('input'); 
      // If it's a color, we still use text input because of CSS variables support
      input.type = 'text'; input.value = val;
    }
    
    input.addEventListener('input', e => {
      // Do not push history on every key stroke to avoid lag, we do it on focus/blur or specific events
      comp.properties[key] = e.target.value;
      renderCanvas();
      triggerAutosave();
    });
    input.addEventListener('focus', pushHistory);
    div.appendChild(input);
    panel.appendChild(div);
  });
}

// Modals & Settings
function openPagesModal() {
  const ul = document.getElementById('pages-list'); ul.innerHTML = '';
  project.pages.forEach(p => {
    const li = document.createElement('li'); li.style.cssText = 'display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eee; align-items:center;';
    li.innerHTML = `<div><strong style="color:#111827;">${p.name}</strong> <span style="color:#9ca3af;font-size:0.8rem;margin-left:8px;">/${p.slug}.html</span> ${p.isHome ? '<span style="background:#dbeafe;color:#1d4ed8;padding:2px 6px;border-radius:4px;font-size:0.7rem;margin-left:8px;">Home</span>' : ''}</div>
      <div style="display:flex; gap:6px;">
        ${!p.isHome ? `<button onclick="setHome('${p.id}')" style="font-size:0.75rem;padding:4px 8px;">Set Home</button><button onclick="deletePage('${p.id}')" style="font-size:0.75rem;padding:4px 8px;color:#ef4444;border-color:#fecaca;background:#fef2f2;">Delete</button>` : ''}
      </div>`;
    ul.appendChild(li);
  });
  document.getElementById('pages-modal').style.display = 'flex';
}
function addPage() {
  const name = document.getElementById('new-page-name').value;
  if(name) {
    pushHistory();
    project.pages.push({ id: generateId(), name: name, slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'), isHome: false, components: [] });
    document.getElementById('new-page-name').value = '';
    renderPageSelector(); openPagesModal();
  }
}
function deletePage(id) { pushHistory(); project.pages = project.pages.filter(p=>p.id!==id); if(currentPageId===id) switchPage(project.pages[0].id); renderPageSelector(); openPagesModal(); }
function setHome(id) { pushHistory(); project.pages.forEach(p=>p.isHome = false); project.pages.find(p=>p.id===id).isHome = true; openPagesModal(); }

function openSettingsModal() {
  const s = project.settings;
  document.getElementById('set-name').value = project.name;
  document.getElementById('set-title').value = s.title;
  document.getElementById('set-primary').value = s.primaryColor.startsWith('#') ? s.primaryColor : '#3b82f6';
  document.getElementById('set-bg').value = s.backgroundColor.startsWith('#') ? s.backgroundColor : '#ffffff';
  document.getElementById('set-text').value = s.textColor.startsWith('#') ? s.textColor : '#111827';
  document.getElementById('set-font').value = s.fontFamily;
  document.getElementById('settings-modal').style.display = 'flex';
}
function saveSettings() {
  pushHistory();
  project.name = document.getElementById('set-name').value;
  document.getElementById('project-name').textContent = project.name;
  const s = project.settings;
  s.title = document.getElementById('set-title').value;
  s.primaryColor = document.getElementById('set-primary').value;
  s.backgroundColor = document.getElementById('set-bg').value;
  s.textColor = document.getElementById('set-text').value;
  s.fontFamily = document.getElementById('set-font').value;
  updateGlobalStyles(); renderCanvas(); closeModal('settings-modal');
}
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function togglePreview() {
  isPreview = !isPreview;
  const btn = document.getElementById('preview-btn');
  if(isPreview) { document.body.classList.add('preview-mode'); btn.textContent = 'Exit Preview'; btn.style.background = 'var(--primary)'; btn.style.color = '#fff'; selectedComponentId = null;}
  else { document.body.classList.remove('preview-mode'); btn.textContent = 'Preview'; btn.style.background = ''; btn.style.color = ''; }
  renderCanvas(); renderProperties();
}
function setPreviewMode(mode) {
  const cw = document.getElementById('canvas-wrapper');
  if(mode === 'mobile') { cw.style.maxWidth = '375px'; }
  else { cw.style.maxWidth = '1200px'; }
}

function exportProject() { window.location.href = `/api/projects/${projectId}/export`; }

// Shortcuts
document.addEventListener('keydown', e => {
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); triggerAutosave(); }
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if(e.shiftKey) redo(); else undo(); }
  if((e.key === 'Delete' || e.key === 'Backspace') && !['INPUT','TEXTAREA'].includes(e.target.tagName)) { if(selectedComponentId) deleteComponent(selectedComponentId); }
  if(e.key === 'Escape') { selectedComponentId = null; renderCanvas(); renderProperties(); }
});
