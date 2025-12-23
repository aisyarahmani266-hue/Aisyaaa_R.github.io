// State
let products = [];
let cart = [];
let transactions = [];
let currentCategory = 'all';

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    populateReportFilter(); // Populate filter first
    renderProducts();
    renderInventory();
    setupEventListeners();
    renderReports();
});

function loadData() {
    const storedProducts = localStorage.getItem('toko_adila_products');
    const storedTransactions = localStorage.getItem('toko_adila_transactions');

    if (storedProducts) {
        products = JSON.parse(storedProducts);
    } else {
        products = [...INITIAL_PRODUCTS];
        saveProducts();
    }

    if (storedTransactions) {
        transactions = JSON.parse(storedTransactions);
    }
}

function saveProducts() {
    localStorage.setItem('toko_adila_products', JSON.stringify(products));
}

function saveTransactions() {
    localStorage.setItem('toko_adila_transactions', JSON.stringify(transactions));
}

// Navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));

    document.getElementById(`page-${pageId}`).classList.add('active');

    // Update active nav
    const index = ['cashier', 'inventory', 'reports'].indexOf(pageId);
    if (index !== -1) {
        document.querySelectorAll('.nav-links li')[index].classList.add('active');
    }
}

// Cashier Logic
function renderProducts(searchQuery = '') {
    const grid = document.getElementById('product-grid-container');
    grid.innerHTML = '';

    let filtered = currentCategory === 'all'
        ? products
        : products.filter(p => p.category === currentCategory);

    if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(lowerQ) ||
            p.code.toLowerCase().includes(lowerQ)
        );
    }

    filtered.forEach(product => {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.onclick = () => addToCart(product);
        div.innerHTML = `
            <div class="product-name">${product.name}</div>
            <div class="product-category">${product.category}</div>
            <div class="product-price">Rp ${product.price.toLocaleString()}</div>
        `;
        grid.appendChild(div);
    });
}

function filterCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Clear search when changing category? Or keep it? keeping it is better usually, 
    // but simplified to clear query for now or re-apply. 
    // Let's just reset input to clean state for user clarity
    document.getElementById('cashier-input-code').value = '';
    renderProducts();
}

function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    renderCart();
}

function addToCartByInput() {
    const input = document.getElementById('cashier-input-code');
    const code = input.value.trim();
    if (!code) return;

    // Search by code or strictly by name case-insensitive
    const product = products.find(p =>
        p.code.toLowerCase() === code.toLowerCase() ||
        p.name.toLowerCase() === code.toLowerCase()
    );

    if (product) {
        addToCart(product);
        input.value = '';
        input.focus();
    } else {
        alert('Barang tidak ditemukan!');
    }
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';

    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-state">Belum ada pesanan</div>';
    } else {
        cart.forEach(item => {
            total += item.price * item.qty;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>Rp ${item.price.toLocaleString()}</p>
                </div>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
                </div>
            `;
            container.appendChild(itemDiv);
        });
    }

    document.getElementById('cart-total-display').innerText = `Rp ${total.toLocaleString()}`;
}

function updateQty(id, change) {
    const itemIndex = cart.findIndex(item => item.id === id);
    if (itemIndex > -1) {
        cart[itemIndex].qty += change;
        if (cart[itemIndex].qty <= 0) {
            cart.splice(itemIndex, 1);
        }
        renderCart();
    }
}

function clearCart() {
    if (confirm('Reset belanja ya/tidak?')) {
        cart = [];
        renderCart();
    }
}

function processCheckout(statusType = 'lunas') {
    if (cart.length === 0) return alert('Keranjang kosong!');

    let pembeli = '-';
    if (statusType === 'hutang') {
        pembeli = prompt('Masukkan Nama Pembeli (Hutang):');
        if (!pembeli) return; // Cancel if no name
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const transaction = {
        id: Date.now(),
        date: new Date().toISOString(),
        items: [...cart],
        total: total,
        status: statusType,
        pembeli: pembeli
    };

    transactions.push(transaction);
    saveTransactions();

    alert(`Total: Rp ${total.toLocaleString()}\nTransaksi Berhasil (${statusType.toUpperCase()})`);
    cart = [];
    renderCart();
    populateReportFilter();
    renderReports();
}

// Inventory Logic
// Inventory Logic
function renderInventory() {
    const tbody = document.getElementById('inventory-table-body');
    tbody.innerHTML = '';

    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.code}</td>
            <td>${p.name}</td>
            <td>${p.category}</td>
            <td>Rp ${p.price.toLocaleString()}</td>
            <td>${p.stock}</td>
            <td>
                <button class="btn-secondary" style="margin-right:4px; padding:4px 8px; font-size:0.8rem;" onclick="editProduct('${p.id}')">Edit</button>
                <button class="btn-danger-text" onclick="deleteProduct('${p.id}')">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

const CATEGORY_PREFIXES = {
    'persabunan': 'S',
    'minuman': 'M',
    'makanan': 'F',
    'bahan': 'B',
    'bumbu': 'C',
    'pulsa': 'P',
    'token': 'T',
    'lainnya': 'L'
};

function generateProductCode(category = 'persabunan') {
    const prefix = CATEGORY_PREFIXES[category.toLowerCase()] || 'X';

    // Filter existing products with this prefix
    const existingCodes = products
        .map(p => p.code)
        .filter(c => c.startsWith(prefix));

    // Find max number
    let maxNum = 0;
    existingCodes.forEach(c => {
        const numStr = c.substring(prefix.length);
        const num = parseInt(numStr);
        if (!isNaN(num) && num > maxNum) {
            maxNum = num;
        }
    });

    const nextNum = maxNum + 1;
    // Format: Prefix + 3 digit number (001)
    return `${prefix}${nextNum.toString().padStart(3, '0')}`;
}

function openProductModal() {
    document.getElementById('product-modal').classList.remove('hidden');
    document.getElementById('product-form').reset();
    document.getElementById('edit-product-id').value = '';

    // Auto Generate Code for New Product (Default Category)
    const defaultCat = document.getElementById('prod-category').value;
    const newCode = generateProductCode(defaultCat);

    const codeInput = document.getElementById('prod-code');
    codeInput.value = newCode;
    codeInput.readOnly = true;

    document.getElementById('modal-title').innerText = 'Tambah Barang';
}

function editProduct(id) {
    const p = products.find(prod => prod.id === id);
    if (!p) return;

    openProductModal();
    document.getElementById('edit-product-id').value = p.id;
    document.getElementById('modal-title').innerText = 'Edit Barang';

    const codeInput = document.getElementById('prod-code');
    codeInput.value = p.code;
    codeInput.readOnly = true;

    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-category').value = p.category;
    document.getElementById('prod-price').value = p.price;
    document.getElementById('prod-stock').value = p.stock;
}

// Add global listener once for optimization? Or just bind it here if safe. 
// It's safer to add it in setupEventListeners, but rewriting that function is expensive. 
// Let's check for existing logic in openProductModal or just add an onchange attribute in HTML? 
// No, let's keep it clean in JS. We'll add it in setupEventListeners via a separate replace.


function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
}

function handleProductSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-product-id').value;
    const code = document.getElementById('prod-code').value;
    const name = document.getElementById('prod-name').value;
    const cat = document.getElementById('prod-category').value;
    const price = parseInt(document.getElementById('prod-price').value);
    const stock = parseInt(document.getElementById('prod-stock').value);

    // Check for duplicate code (exclude self if editing)
    const duplicate = products.find(p => p.code === code && p.id !== id);
    if (duplicate) {
        alert('Kode barang sudah ada!');
        return;
    }

    if (id) {
        // Edit
        const index = products.findIndex(p => p.id === id);
        if (index > -1) {
            products[index] = { ...products[index], code, name, category: cat, price, stock };
        }
    } else {
        // Add
        const newProduct = {
            id: Date.now().toString(),
            code, name, category: cat, price, stock
        };
        products.push(newProduct);
    }

    saveProducts();
    renderProducts();
    renderInventory();
    closeProductModal();
}

function deleteProduct(id) {
    if (confirm('Yakin hapus barang ini?')) {
        products = products.filter(p => p.id !== id);
        saveProducts();
        renderProducts();
        renderInventory();
    }
}

// Reports Logic
function populateReportFilter() {
    const select = document.getElementById('report-month-filter');
    const existingVal = select.value;
    select.innerHTML = '<option value="all">Semua Waktu</option>';

    const months = [...new Set(transactions.map(t => {
        const d = new Date(t.date);
        return `${d.getFullYear()}-${d.getMonth() + 1}`;
    }))];

    // Sort descending
    months.sort().reverse();

    months.forEach(m => {
        const [year, month] = m.split('-');
        const dateObj = new Date(year, month - 1);
        const label = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

        const opt = document.createElement('option');
        opt.value = m;
        opt.innerText = label;
        select.appendChild(opt);
    });

    if (months.includes(existingVal)) {
        select.value = existingVal;
    }
}

function renderReports() {
    const tbodyLunas = document.getElementById('report-lunas-body');
    const tbodyHutang = document.getElementById('report-hutang-body');

    tbodyLunas.innerHTML = '';
    tbodyHutang.innerHTML = '';

    const filter = document.getElementById('report-month-filter').value;
    let filteredTransactions = transactions;

    if (filter !== 'all') {
        filteredTransactions = transactions.filter(t => {
            const d = new Date(t.date);
            const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
            return key === filter;
        });
    }

    let totalRevenue = 0;
    // Sort new to old
    filteredTransactions.sort((a, b) => b.id - a.id);

    filteredTransactions.forEach(t => {
        const date = new Date(t.date);
        const dateStr = date.toLocaleDateString('id-ID');
        const timeStr = date.toLocaleTimeString('id-ID');
        const status = t.status || 'lunas';
        const pembeli = t.pembeli || '-';

        if (status === 'hutang') {
            // Render to Hutang Table
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td>${pembeli}</td>
                <td>${t.items.length} jenis</td>
                <td>Rp ${t.total.toLocaleString()}</td>
                <td>
                    <button class="btn-check" style="background:#81c784; border:none; color:#1b5e20; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.8rem; display:flex; align-items:center; gap:4px;" 
                        onclick="markAsPaid(${t.id})">
                        <i data-lucide="check-circle" style="width:16px; height:16px;"></i> Lunasi
                    </button>
                </td>
             `;
            tbodyHutang.appendChild(tr);
        } else {
            // Render to Lunas Table
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dateStr}</td>
                <td>${timeStr}</td>
                <td>${pembeli}</td>
                <td>${t.items.length} jenis</td>
                <td>Rp ${t.total.toLocaleString()}</td>
                <td>
                    <span style="
                        padding: 4px 8px; 
                        border-radius: 4px; 
                        font-size: 0.8rem; 
                        background: #c8e6c9;
                        color: #2e7d32;
                        font-weight: 500;
                    ">LUNAS</span>
                </td>
            `;
            tbodyLunas.appendChild(tr);
            totalRevenue += t.total;
        }
    });

    document.getElementById('report-total-revenue').innerText = `Rp ${totalRevenue.toLocaleString()}`;
    if (window.lucide) lucide.createIcons();
}

function markAsPaid(id) {
    if (!confirm('Tandai transaksi ini sudah lunas?')) return;

    // Find transaction by ID (ensure type safety if ID is string/number mismatch, usually number from Date.now())
    const tx = transactions.find(t => t.id == id);
    if (tx) {
        tx.status = 'lunas';
        saveTransactions();
        renderReports();
    }
}

function setupEventListeners() {
    // Enter key on cashier input
    document.getElementById('cashier-input-code').addEventListener('keyup', function (e) {
        if (e.key === 'Enter') {
            addToCartByInput();
        } else {
            // Live Search
            renderProducts(this.value);
        }
    });

    // Close modal when clicking outside
    window.onclick = function (event) {
        const modal = document.getElementById('product-modal');
        if (event.target == modal) {
            closeProductModal();
        }
    }

    // Dynamic Code Generation on Category Change (Only for New Items)
    document.getElementById('prod-category').addEventListener('change', function () {
        const isEdit = document.getElementById('edit-product-id').value !== '';
        // Only regenerate if adding new item (not editing)
        if (!isEdit) {
            const newCode = generateProductCode(this.value);
            document.getElementById('prod-code').value = newCode;
        }
    });
}
