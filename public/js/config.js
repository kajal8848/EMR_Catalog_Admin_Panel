const CustomerManager = (() => {
  const BASE_URL = '/api';
  const editingRows = new Map();
  
  const TABLE_COLUMNS = [
    { key: 'yCmId', label: 'Customer ID' },
    { key: 'yCmCd', label: 'Customer Code' },
    { key: 'yCmName', label: 'Name' },
    { key: 'yCmEmail', label: 'Email' },
    { key: 'yCmCurCd', label: 'Currency' },
    { key: 'yCmDfltLng', label: 'Language' },
    { key: 'yCmMulBy', label: 'Multiplier', editable: true },
    { key: 'yCmValidYN', label: 'Valid Y/N', editable: true }
  ];

  // Initialize
  function init() {
    // Check if user is logged in
    const modUsr = sessionStorage.getItem('modUsr');
    if (!modUsr) {
      window.location.href = '/login';
      return;
    }
    
    document.getElementById('filterForm')?.addEventListener('submit', handleFormSubmit);
  }

  // Handle form submission
  async function handleFormSubmit(e) {
    e.preventDefault();
    const operation = document.getElementById('operation').value;
    
    if (!operation) {
      showMessage('Please select an operation', 'error');
      return;
    }
    
    if (operation === 'add_custMst') {
      await loadCustomerData();
    }
  }

  // Load customer data
  async function loadCustomerData() {
    showLoading(true);
    editingRows.clear();
    
    try {
      const response = await fetch(`${BASE_URL}/getCustMst`);
      const result = await response.json();
      
      if (result.success) {
        renderTable(result.data || []);
        document.getElementById('dataTitle').textContent = 'Customer Management';
        document.getElementById('resultsSection').classList.remove('hidden');
      } else {
        showMessage(result.error || 'Failed to load customer data', 'error');
      }
    } catch (error) {
      showMessage('Error loading customer data: ' + error.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  // Update customer
  async function updateCustomer(rowId, multiplierValue, validYN) {
    showLoading(true);
    
    const modUsr = sessionStorage.getItem('modUsr') || '';
    
    try {
      const response = await fetch(`${BASE_URL}/updateCustMst`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          yCmId: rowId, 
          yCmMulBy: parseFloat(multiplierValue),
          yCmValidYN: validYN,
          modUsr: modUsr 
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showMessage('Customer updated successfully.', 'success');
        return true;
      } else {
        showMessage(result.error || 'Failed to update customer', 'error');
        return false;
      }
    } catch (error) {
      showMessage('Error updating customer: ' + error.message, 'error');
      return false;
    } finally {
      showLoading(false);
    }
  }

  // Render table
  function renderTable(data) {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    
    // Render header
    tableHeader.innerHTML = '<tr>' + 
      TABLE_COLUMNS.map(col => `<th>${col.label}</th>`).join('') + 
      '<th>Action</th></tr>';
    
    // Render body
    if (!data || data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No data available</td></tr>';
      return;
    }
    
    tableBody.innerHTML = data.map(row => {
      const cells = TABLE_COLUMNS.map(col => {
        const value = row[col.key] ?? '';
        if (col.editable) {
          if (col.key === 'yCmMulBy') {
            return `<td><input type="number" step="0.01" min="1" class="edit-field" 
                      data-field="${col.key}" value="${value}" 
                      oninput="CustomerManager.validateDecimalInput(this)" disabled></td>`;
          } else if (col.key === 'yCmValidYN') {
            return `<td>
                      <select class="edit-field" data-field="${col.key}" disabled>
                        <option value="Y" ${value === 'Y' ? 'selected' : ''}>Y</option>
                        <option value="N" ${value === 'N' ? 'selected' : ''}>N</option>
                      </select>
                    </td>`;
          }
        }
        return `<td>${value}</td>`;
      }).join('');
      
      return `<tr data-id="${row.yCmId}">${cells}
        <td class="action-cell">
          <button class="action-btn edit-btn" onclick="CustomerManager.toggleEdit(${row.yCmId})" title="Edit">✏️</button>
          <button class="action-btn save-btn hidden" onclick="CustomerManager.saveRow(${row.yCmId})" title="Save">💾</button>
          <button class="action-btn cancel-btn hidden" onclick="CustomerManager.cancelEdit(${row.yCmId})" title="Cancel">❌</button>
        </td></tr>`;
    }).join('');
  }

  // Toggle edit mode
  function toggleEdit(rowId) {
    const row = document.querySelector(`tr[data-id="${rowId}"]`);
    if (!row) return;
    
    const inputs = row.querySelectorAll('.edit-field');
    const editBtn = row.querySelector('.edit-btn');
    const saveBtn = row.querySelector('.save-btn');
    const cancelBtn = row.querySelector('.cancel-btn');
    
    // Store original values
    const originalValues = {};
    inputs.forEach(input => {
      const field = input.dataset.field;
      originalValues[field] = input.value;
    });
    editingRows.set(rowId, originalValues);
    
    // Enable editing
    inputs.forEach(input => {
      input.disabled = false;
      input.classList.add('editing');
    });
    
    const multiplierInput = row.querySelector('input[data-field="yCmMulBy"]');
    if (multiplierInput) {
      multiplierInput.focus();
      multiplierInput.select();
    }
    
    editBtn.classList.add('hidden');
    saveBtn.classList.remove('hidden');
    cancelBtn.classList.remove('hidden');
    row.classList.add('editing-row');
  }

  // Cancel edit
  function cancelEdit(rowId) {
    const row = document.querySelector(`tr[data-id="${rowId}"]`);
    if (!row) return;
    
    const originalValues = editingRows.get(rowId);
    if (!originalValues) return;
    
    const inputs = row.querySelectorAll('.edit-field');
    const editBtn = row.querySelector('.edit-btn');
    const saveBtn = row.querySelector('.save-btn');
    const cancelBtn = row.querySelector('.cancel-btn');
    
    // Restore original values
    inputs.forEach(input => {
      const field = input.dataset.field;
      input.value = originalValues[field];
      input.disabled = true;
      input.classList.remove('editing');
    });
    
    editBtn.classList.remove('hidden');
    saveBtn.classList.add('hidden');
    cancelBtn.classList.add('hidden');
    row.classList.remove('editing-row');
    
    editingRows.delete(rowId);
  }

  // Save row
  async function saveRow(rowId) {
    const row = document.querySelector(`tr[data-id="${rowId}"]`);
    if (!row) return;
    
    const multiplierInput = row.querySelector('input[data-field="yCmMulBy"]');
    const validYNSelect = row.querySelector('select[data-field="yCmValidYN"]');
    
    const multiplierValue = multiplierInput.value.trim();
    const validYNValue = validYNSelect.value;
    
    // Validate multiplier
    if (!multiplierValue) {
      showMessage('Multiplier value is required', 'error');
      multiplierInput.focus();
      return;
    }
    
    if (isNaN(multiplierValue) || parseFloat(multiplierValue) < 1) {
      showMessage('Multiplier must be 1 or greater', 'error');
      multiplierInput.focus();
      return;
    }
    
    // Validate Valid Y/N
    if (!validYNValue || (validYNValue !== 'Y' && validYNValue !== 'N')) {
      showMessage('Valid Y/N must be Y or N', 'error');
      validYNSelect.focus();
      return;
    }
    
    // Save to server
    const success = await updateCustomer(rowId, multiplierValue, validYNValue);
    
    if (success) {
      const inputs = row.querySelectorAll('.edit-field');
      const editBtn = row.querySelector('.edit-btn');
      const saveBtn = row.querySelector('.save-btn');
      const cancelBtn = row.querySelector('.cancel-btn');
      
      inputs.forEach(input => {
        input.disabled = true;
        input.classList.remove('editing');
      });
      
      editBtn.classList.remove('hidden');
      saveBtn.classList.add('hidden');
      cancelBtn.classList.add('hidden');
      row.classList.remove('editing-row');
      
      editingRows.delete(rowId);
    }
  }

  // Validate decimal input
  function validateDecimalInput(input) {
    let value = input.value;
    if (value === '') return;
    
    // Remove invalid characters
    value = value.replace(/[^\d.-]/g, '');
    
    // Enforce minimum value
    if (parseFloat(value) < 1 && value !== '' && value !== '-') {
      value = '1';
    }
    
    // Limit to 2 decimal places
    if (value.includes('.')) {
      const parts = value.split('.');
      if (parts[1] && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, 2);
      }
    }
    
    input.value = value;
  }

  // Show loading overlay
  function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
      overlay?.classList.remove('hidden');
    } else {
      overlay?.classList.add('hidden');
    }
  }

  function showMessage(message, type = 'info') {
    const container = document.getElementById('messageContainer');
    if (!container) return;
    
    const div = document.createElement('div');
    div.textContent = message;
    const escapedMessage = div.innerHTML;
    
    container.innerHTML = `<div class="message ${type}">${escapedMessage}</div>`;
    
    setTimeout(() => {
      container.innerHTML = '';
    }, 5000);
  }

  return {
    init,
    toggleEdit,
    cancelEdit,
    saveRow,
    validateDecimalInput
  };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', CustomerManager.init);
} else {
  CustomerManager.init();
}