function updateCapacity() {
    const l1 = parseInt(document.getElementById('warehouse-l1').value) || 0;
    const l2 = parseInt(document.getElementById('warehouse-l2').value) || 0;
    const l3 = parseInt(document.getElementById('warehouse-l3').value) || 0;
    const total = l1 + l2 + l3;
    const capacity = l1 * 5 + l2 * 10 + l3 * 20;
    document.getElementById('total-warehouses').textContent = total;
    document.getElementById('capacity').textContent = capacity;
}

function addItemToList(name, count, storageType) {
    const list = document.getElementById('warehouse-items');
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
        <span>
            ${name} (${storageType === 'single' ? '1:1' : '10:1'}) - ${count}
        </span>
        <button class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">✖</button>
    `;
    list.appendChild(li);
}

function saveWarehouse() {
    const data = {
        kingdom_id: kingdomData.id,
        warehouse_level: [
            parseInt(document.getElementById('warehouse-l1').value) || 0,
            parseInt(document.getElementById('warehouse-l2').value) || 0,
            parseInt(document.getElementById('warehouse-l3').value) || 0
        ],
        items: []
    };

    document.querySelectorAll('#warehouse-items li').forEach(li => {
        const text = li.querySelector('span').textContent;
        const match = text.match(/(.+) \((1:1|10:1)\) - (\d+)/);
        if (match) {
            data.items.push({
                name: match[1].trim(),
                count: parseInt(match[3]),
                storage_type: match[2] === '1:1' ? 'single' : 'stack'
            });
        }
    });
    return data;
}

// Арифметика для полей уровней склада
function parseArithmeticExpression(inputStr, currentValue) {
    if (!inputStr || typeof inputStr !== 'string') return currentValue;
    let str = inputStr.replace(/\s/g, '');
    if (str === '') return currentValue;
    const firstChar = str[0];
    const isRelative = (firstChar === '+' || firstChar === '-');
    const tokens = str.match(/([+-]?\d+)/g);
    if (!tokens || tokens.length === 0) return currentValue;
    let sum = 0;
    for (let token of tokens) {
        let num = parseInt(token, 10);
        if (!isNaN(num)) sum += num;
    }
    return isRelative ? currentValue + sum : sum;
}

function handleFieldEdit(event) {
    const input = event.target;
    const rawValue = input.value.trim();
    if (rawValue === '') return;
    let currentValue = parseInt(rawValue, 10);
    if (isNaN(currentValue)) currentValue = 0;
    const newValue = parseArithmeticExpression(rawValue, currentValue);
    if (!isNaN(newValue)) {
        input.value = newValue;
        if (input.id === 'warehouse-l1' || input.id === 'warehouse-l2' || input.id === 'warehouse-l3') {
            updateCapacity();
        }
    } else {
        input.value = currentValue;
    }
}

function setupFieldEditing() {
    const inputs = ['warehouse-l1', 'warehouse-l2', 'warehouse-l3'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.removeEventListener('blur', handleFieldEdit);
            el.addEventListener('blur', handleFieldEdit);
        }
    });
}

// Загрузка данных
if (kingdomData) {
    const levels = kingdomData.warehouse_level ? kingdomData.warehouse_level.split(',').map(x => parseInt(x)) : [0,0,0];
    document.getElementById('warehouse-l1').value = levels[0];
    document.getElementById('warehouse-l2').value = levels[1];
    document.getElementById('warehouse-l3').value = levels[2];
    updateCapacity();

    if (kingdomData.items && kingdomData.items.length) {
        kingdomData.items.forEach(item => {
            addItemToList(item.name, item.count, item.storage_type);
        });
    }
}

// Обработчики
document.getElementById('warehouse-l1').addEventListener('input', updateCapacity);
document.getElementById('warehouse-l2').addEventListener('input', updateCapacity);
document.getElementById('warehouse-l3').addEventListener('input', updateCapacity);

document.getElementById('add-item').addEventListener('click', () => {
    const name = document.getElementById('item-name').value.trim();
    const count = parseInt(document.getElementById('item-count').value) || 1;
    const storageType = document.getElementById('storage-type').value;
    if (!name) {
        alert('Введите название ресурса');
        return;
    }
    addItemToList(name, count, storageType);
    document.getElementById('item-name').value = '';
});

document.getElementById('saveBtn').addEventListener('click', async () => {
    const data = saveWarehouse();
    const response = await fetch('/warehouse/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (response.ok) {
        window.location.href = `/kingdom?kingdom_id=${kingdomData.id}`;
    } else {
        const error = await response.json();
        alert('Ошибка: ' + (error.detail || 'Неизвестная ошибка'));
    }
});

setupFieldEditing();
updateCapacity();
