const API_BASE_URL = 'http://localhost:3000/beans';
let allBeans = [];
let currentPage = 1;
const rowsPerPage = 10;
let sortColumn = 'id';
let sortDirection = 'asc';
let beansChart = null;

document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    loadBeans();
    
    // Set up event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', function(e) {
        filterBeans(e.target.value);
    });
    
    // Clear search
    document.getElementById('clearSearch').addEventListener('click', function() {
        document.getElementById('searchInput').value = '';
        filterBeans('');
    });
    
    // Add bean form
    document.getElementById('addBeanForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await addBean();
    });
    
    // Edit bean form
    document.getElementById('editBeanForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await updateBean();
    });
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', function() {
        loadBeans();
    });
    
    // Toggle chart button
    document.getElementById('toggleChartBtn').addEventListener('click', function() {
        const chartSection = document.getElementById('chartSection');
        chartSection.classList.toggle('d-none');
        if (!chartSection.classList.contains('d-none') && beansChart === null) {
            renderBeansChart();
        }
    });
    
    // Export CSV button
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCsv);
    
    // Sort buttons
    document.querySelectorAll('.btn-sort').forEach(btn => {
        btn.addEventListener('click', function() {
            const column = this.getAttribute('data-sort');
            if (sortColumn === column) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = column;
                sortDirection = 'asc';
            }
            renderBeansTable(allBeans);
        });
    });
}

async function loadBeans() {
    try {
        showLoading(true);
        const response = await fetch(API_BASE_URL, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server returned ${response.status}`);
        }

        allBeans = await response.json();

        if (!allBeans || !Array.isArray(allBeans)) {
            throw new Error('Invalid data format received from server');
        }

        if (allBeans.length === 0) {
            showToast('No beans found in database', 'warning');
        } else {
            updateStats(allBeans);
            renderBeansTable(allBeans);
            if (!document.getElementById('chartSection').classList.contains('d-none')) {
                renderBeansChart();
            }
            showToast(`Loaded ${allBeans.length} beans successfully`, 'success');
        }
    } catch (error) {
        console.error('Failed to load beans:', error);
        showToast(`Failed to load beans: ${error.message}`, 'danger');
    } finally {
        showLoading(false);
    }
}

function updateStats(beans) {
    document.getElementById('totalBeans').textContent = beans.length;
    
    // Count unique bean classes
    const uniqueClasses = [...new Set(beans.map(bean => bean.bean_class))];
    document.getElementById('totalClasses').textContent = uniqueClasses.length;
    
    // Calculate average area
    const avgArea = beans.reduce((sum, bean) => sum + parseFloat(bean.area || 0), 0) / beans.length;
    document.getElementById('avgArea').textContent = formatNumber(avgArea);
    
    // Calculate average perimeter
    const avgPerimeter = beans.reduce((sum, bean) => sum + parseFloat(bean.perimeter || 0), 0) / beans.length;
    document.getElementById('avgPerimeter').textContent = formatNumber(avgPerimeter);
}

function filterBeans(searchTerm) {
    const filteredBeans = allBeans.filter(bean => {
        return Object.values(bean).some(value => 
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
    });
    renderBeansTable(filteredBeans);
}

function renderBeansTable(beans) {
    const tableBody = document.getElementById('beansTableBody');
    tableBody.innerHTML = '';

    // Sort beans
    const sortedBeans = [...beans].sort((a, b) => {
        const valA = a[sortColumn] || '';
        const valB = b[sortColumn] || '';
        
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // Paginate
    const totalPages = Math.ceil(sortedBeans.length / rowsPerPage);
    const paginatedBeans = sortedBeans.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    // Update table info
    document.getElementById('tableInfo').textContent = 
        `Showing ${paginatedBeans.length} of ${sortedBeans.length} entries`;

    // Render rows
    paginatedBeans.forEach(bean => {
        const row = document.createElement('tr');
        row.className = 'fade-in';
        row.innerHTML = `
            <td>${bean.id || 'N/A'}</td>
            <td>
                <span class="badge bg-primary">${bean.bean_class || 'N/A'}</span>
            </td>
            <td>${formatNumber(bean.area)}</td>
            <td>${formatNumber(bean.perimeter)}</td>
            <td>${formatNumber(bean.major_axis_length)}</td>
            <td>${formatNumber(bean.minor_axis_length)}</td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-info view-btn" data-id="${bean.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-warning edit-btn" data-id="${bean.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger delete-btn" data-id="${bean.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Render pagination
    renderPagination(sortedBeans.length);

    // Set up event listeners for the new buttons
    setupButtonEventListeners();
}

function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Previous" id="prevPage">
            <span aria-hidden="true">&laquo;</span>
        </a>
    `;
    pagination.appendChild(prevLi);

    // Page buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
        pagination.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Next" id="nextPage">
            <span aria-hidden="true">&raquo;</span>
        </a>
    `;
    pagination.appendChild(nextLi);

    // Add event listeners
    document.getElementById('prevPage')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            renderBeansTable(allBeans);
        }
    });

    document.getElementById('nextPage')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            renderBeansTable(allBeans);
        }
    });

    document.querySelectorAll('.page-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = parseInt(link.getAttribute('data-page'));
            renderBeansTable(allBeans);
        });
    });
}

function renderBeansChart() {
    const ctx = document.getElementById('beansChart').getContext('2d');
    
    // Count beans by class
    const beanCounts = {};
    allBeans.forEach(bean => {
        const beanClass = bean.bean_class || 'Unknown';
        beanCounts[beanClass] = (beanCounts[beanClass] || 0) + 1;
    });
    
    const labels = Object.keys(beanCounts);
    const data = Object.values(beanCounts);
    
    // Colors for chart
    const backgroundColors = [
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 99, 132, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 205, 86, 0.7)',
        'rgba(201, 203, 207, 0.7)'
    ];
    
    if (beansChart) {
        beansChart.destroy();
    }
    
    beansChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Beans',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} beans (${((context.parsed.y / allBeans.length) * 100).toFixed(1)}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

function setupButtonEventListeners() {
    // View buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const beanId = this.getAttribute('data-id');
            await viewBean(beanId);
        });
    });

    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const beanId = this.getAttribute('data-id');
            await loadBeanForEdit(beanId);
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const beanId = this.getAttribute('data-id');
            await deleteBean(beanId);
        });
    });
}

async function viewBean(beanId) {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/${beanId}`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server returned ${response.status}`);
        }

        const bean = await response.json();

        const modalContent = document.getElementById('beanDetailsContent');
        modalContent.innerHTML = `
            <div class="row">
                ${bean.image_url ? `
                <div class="col-md-4 mb-3">
                    <div class="card">
                        <img src="${bean.image_url}" class="card-img-top" alt="Bean Image" style="max-height: 200px; object-fit: contain;">
                        <div class="card-body text-center">
                            <h5 class="card-title">${bean.bean_class || 'N/A'}</h5>
                        </div>
                    </div>
                </div>
                <div class="col-md-8">
                ` : '<div class="col-md-12">'}
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0">Bean Class</h6>
                                </div>
                                <div class="card-body">
                                    <p class="mb-0">${bean.bean_class || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0">Area</h6>
                                </div>
                                <div class="card-body">
                                    <p class="mb-0">${formatNumber(bean.area)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0">Perimeter</h6>
                                </div>
                                <div class="card-body">
                                    <p class="mb-0">${formatNumber(bean.perimeter)}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0">Major Axis Length</h6>
                                </div>
                                <div class="card-body">
                                    <p class="mb-0">${formatNumber(bean.major_axis_length)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0">Minor Axis Length</h6>
                                </div>
                                <div class="card-body">
                                    <p class="mb-0">${formatNumber(bean.minor_axis_length)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const viewModal = new bootstrap.Modal(document.getElementById('viewBeanModal'));
        viewModal.show();
    } catch (error) {
        console.error('Error viewing bean:', error);
        showToast(`Error viewing bean: ${error.message}`, 'danger');
    } finally {
        showLoading(false);
    }
}

async function loadBeanForEdit(beanId) {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/${beanId}`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server returned ${response.status}`);
        }

        const bean = await response.json();

        // Populate the edit form
        document.getElementById('editBeanId').value = bean.id;
        document.getElementById('editBeanClass').value = bean.bean_class || '';
        document.getElementById('editBeanArea').value = bean.area || '';
        document.getElementById('editBeanPerimeter').value = bean.perimeter || '';
        document.getElementById('editBeanMajorAxis').value = bean.major_axis_length || '';
        document.getElementById('editBeanMinorAxis').value = bean.minor_axis_length || '';
        document.getElementById('editBeanImage').value = bean.image_url || '';

        // Show the edit modal
        const editModal = new bootstrap.Modal(document.getElementById('editBeanModal'));
        editModal.show();
    } catch (error) {
        console.error('Error loading bean for edit:', error);
        showToast(`Error loading bean for editing: ${error.message}`, 'danger');
    } finally {
        showLoading(false);
    }
}

async function addBean() {
    try {
        showLoading(true);
        
        // Get form data
        const formData = {
            bean_class: document.getElementById('addBeanClass').value,
            area: parseFloat(document.getElementById('addBeanArea').value),
            perimeter: parseFloat(document.getElementById('addBeanPerimeter').value),
            major_axis_length: parseFloat(document.getElementById('addBeanMajorAxis').value),
            minor_axis_length: parseFloat(document.getElementById('addBeanMinorAxis').value)
        };

        // Validate required fields
        if (!formData.bean_class || isNaN(formData.area) || isNaN(formData.perimeter) || 
            isNaN(formData.major_axis_length) || isNaN(formData.minor_axis_length)) {
            throw new Error('Please fill in all required fields with valid values');
        }

        // Send POST request
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server returned ${response.status}`);
        }

        // Close the modal and refresh the table
        const addModal = bootstrap.Modal.getInstance(document.getElementById('addBeanModal'));
        if (addModal) addModal.hide();
        
        // Clear the form
        document.getElementById('addBeanForm').reset();
        
        // Refresh the table
        await loadBeans();
        
        showToast('Bean added successfully!', 'success');
    } catch (error) {
        console.error('Error adding bean:', error);
        showToast(`Failed to add bean: ${error.message}`, 'danger');
    } finally {
        showLoading(false);
    }
}

async function updateBean() {
    try {
        showLoading(true);
        
        // Get form data
        const beanId = document.getElementById('editBeanId').value;
        const formData = {
            bean_class: document.getElementById('editBeanClass').value,
            area: parseFloat(document.getElementById('editBeanArea').value),
            perimeter: parseFloat(document.getElementById('editBeanPerimeter').value),
            major_axis_length: parseFloat(document.getElementById('editBeanMajorAxis').value),
            minor_axis_length: parseFloat(document.getElementById('editBeanMinorAxis').value)
        };

        // Validate required fields
        if (!formData.bean_class || isNaN(formData.area) || isNaN(formData.perimeter) || 
            isNaN(formData.major_axis_length) || isNaN(formData.minor_axis_length)) {
            throw new Error('Please fill in all required fields with valid values');
        }

        // Send PUT request
        const response = await fetch(`${API_BASE_URL}/${beanId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server returned ${response.status}`);
        }

        // Close the modal and refresh the table
        const editModal = bootstrap.Modal.getInstance(document.getElementById('editBeanModal'));
        if (editModal) editModal.hide();
        
        // Refresh the table
        await loadBeans();
        
        showToast('Bean updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating bean:', error);
        showToast(`Failed to update bean: ${error.message}`, 'danger');
    } finally {
        showLoading(false);
    }
}

async function deleteBean(beanId) {
    try {
        const confirmed = await showConfirmDialog(
            'Delete Bean', 
            'Are you sure you want to delete this bean? This action cannot be undone.',
            'warning'
        );
        
        if (!confirmed) return;

        showLoading(true);
        
        // Send DELETE request
        const response = await fetch(`${API_BASE_URL}/${beanId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server returned ${response.status}`);
        }

        // Refresh the table
        await loadBeans();
        
        showToast('Bean deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting bean:', error);
        showToast(`Failed to delete bean: ${error.message}`, 'danger');
    } finally {
        showLoading(false);
    }
}

function exportToCsv() {
    if (allBeans.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }

    // Prepare CSV data
    const headers = ['ID', 'Bean Class', 'Area', 'Perimeter', 'Major Axis Length', 'Minor Axis Length'];
    const data = allBeans.map(bean => [
        bean.id,
        bean.bean_class,
        bean.area,
        bean.perimeter,
        bean.major_axis_length,
        bean.minor_axis_length
    ]);

    // Create CSV
    const csv = Papa.unparse({
        fields: headers,
        data: data
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `beans_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('CSV export started', 'success');
}

// Helper functions
function formatNumber(value) {
    return value ? Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) : 'N/A';
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'info') {
    const toastEl = document.getElementById('toast');
    const toastBody = toastEl.querySelector('.toast-body');
    
    toastEl.className = `toast align-items-center text-white bg-${type} position-fixed top-0 end-0 m-3`;
    toastBody.textContent = message;
    
    const toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 3000
    });
    toast.show();
}

function showConfirmDialog(title, message, type = 'warning') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'confirmModal';
        modal.tabIndex = -1;
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-${type} text-white">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="confirmCancel">Cancel</button>
                        <button type="button" class="btn btn-${type}" id="confirmOk">OK</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const confirmModal = new bootstrap.Modal(modal);
        confirmModal.show();
        
        modal.querySelector('#confirmOk').addEventListener('click', () => {
            confirmModal.hide();
            resolve(true);
        });
        
        modal.querySelector('#confirmCancel').addEventListener('click', () => {
            confirmModal.hide();
            resolve(false);
        });
        
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    });
}