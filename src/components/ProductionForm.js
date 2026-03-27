// ============================================================
// PRODUCTION FORM - Create and manage productions
// ============================================================

export const ProductionForm = () => {
  const saveProduction = async (title, playwright) => {
    try {
      const productions = JSON.parse(localStorage.getItem('productions') || '[]');
      const newProduction = {
        id: Date.now(),
        title,
        playwright,
        createdAt: new Date().toISOString()
      };
      productions.push(newProduction);
      localStorage.setItem('productions', JSON.stringify(productions));
      
      console.log('✅ Production saved:', title);
      return { success: true, data: newProduction };
    } catch (error) {
      console.error('Error saving production:', error);
      return { success: false, error };
    }
  };

  const HTML = `
    <div class="production-form-container">
      <h2>🎬 Create New Production</h2>
      
      <form id="productionForm" class="production-form">
        <div class="form-group">
          <label for="prodTitle">Production Name</label>
          <input 
            type="text" 
            id="prodTitle" 
            placeholder="e.g., Hamlet"
            required
          />
        </div>

        <div class="form-group">
          <label for="prodPlaywright">Playwright Name</label>
          <input 
            type="text" 
            id="prodPlaywright" 
            placeholder="e.g., William Shakespeare"
            required
          />
        </div>

        <button type="submit" class="btn-primary">Create Production</button>
      </form>

      <div id="productionsDisplay" class="productions-list">
        <h3>📚 Your Productions</h3>
        <div id="productionsList"></div>
      </div>
    </div>
  `;

  setTimeout(async () => {
    const form = document.getElementById('productionForm');
    
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('prodTitle').value;
      const playwright = document.getElementById('prodPlaywright').value;
      
      if (!title || !playwright) {
        alert('Please fill in all fields');
        return;
      }
      
      const result = await saveProduction(title, playwright);
      if (result.success) {
        alert('✅ Production created!');
        form.reset();
        displayProductions();
      } else {
        alert('❌ Error creating production');
      }
    });

    displayProductions();
  }, 100);

  const displayProductions = async () => {
    const productions = JSON.parse(localStorage.getItem('productions') || '[]');
    const list = document.getElementById('productionsList');
    
    if (productions.length === 0) {
      list.innerHTML = '<p class="placeholder">No productions yet</p>';
      return;
    }

    list.innerHTML = productions.map(prod => `
      <div class="production-item">
        <div class="prod-info">
          <p class="prod-title">${prod.title}</p>
          <p class="prod-playwright">by ${prod.playwright}</p>
        </div>
        <button class="btn-small-delete" id="delete-${prod.id}">🗑️ Delete</button>
      </div>
    `).join('');

    // Attach delete listeners
    productions.forEach(prod => {
      const deleteBtn = document.getElementById(`delete-${prod.id}`);
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          if (confirm(`Delete "${prod.title}"?`)) {
            const updated = productions.filter(p => p.id !== prod.id);
            localStorage.setItem('productions', JSON.stringify(updated));
            displayProductions();
          }
        });
      }
    });
  };

  return HTML;
};