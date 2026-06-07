let currentAvatar = null;

function setDefaultValues() {
    document.getElementById('kingdom-name').value = 'Моё королевство';
    document.getElementById('wheat').value = 30;
    document.getElementById('gold').value = 1;
    document.getElementById('iron').value = 0;
    document.getElementById('factor').value = 20;
    document.getElementById('people').value = 17;
    document.getElementById('happy').value = 100;
    document.getElementById('institut').value = 1;
    document.getElementById('level').value = 1;
    document.getElementById('economy_profit').value = 10;
    document.getElementById('economy_kazna').value = 0;
    document.getElementById('economy_plus').value = 0;
    document.getElementById('economy_minus').value = 7;
    document.getElementById('war_unit').value = 0;
    document.getElementById('arrow_unit').value = 0;
    document.getElementById('mag_unit').value = 0;
    document.getElementById('town_unit').value = 0;
    document.getElementById('war_ship_unit').value = 0;
    document.getElementById('war_ride_unit').value = 0;
    document.getElementById('weapon_unit').value = 0;
    document.getElementById('ride_unit').value = 0;
    document.getElementById('ship_unit').value = 0;
    document.getElementById('logic_unit').value = 0;
    document.getElementById('cheast_unit').value = 0;
}

function loadImageAsBase64(file) {
    if (!file.type.startsWith('image/')) {
        alert('Выберите изображение');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        currentAvatar = e.target.result;
        const area = document.getElementById('image-area');
        area.innerHTML = `<img src="${currentAvatar}" style="max-width:100%; max-height:100%; object-fit:contain;">`;
        console.log('Avatar загружен, длина:', currentAvatar.length);
    };
    reader.onerror = () => alert('Ошибка чтения файла');
    reader.readAsDataURL(file);
}

// Элементы DOM
const economyProfit = document.getElementById('economy_profit');
const economyKazna = document.getElementById('economy_kazna');
const economyPlus = document.getElementById('economy_plus');
const economyMinus = document.getElementById('economy_minus');
const people = document.getElementById('people');
const gold = document.getElementById('gold');
const level = document.getElementById('level');
const institut = document.getElementById('institut');
const tradeOut = document.getElementById('trade_out');
const tradeOutKingdom = document.getElementById('trade_out_kingdom');
const requestOutput = document.getElementById('request_output');
const requestInput = document.getElementById('request_input');
const addRequestBtn = document.getElementById('add-request');
const updateEconomyBtn = document.getElementById('update-economy');
const imageArea = document.getElementById('image-area');
const loadImageBtn = document.getElementById('load-image-btn');
const warehouseLevel1 = document.getElementById('warehouse_level_1');
const warehouseLevel2 = document.getElementById('warehouse_level_2');
const warehouseLevel3 = document.getElementById('warehouse_level_3');

if (kingdomData) {
    document.getElementById('kingdom-name').value = kingdomData.name;
    document.getElementById('wheat').value = kingdomData.wheat;
    document.getElementById('gold').value = kingdomData.gold;
    document.getElementById('iron').value = kingdomData.iron;
    document.getElementById('factor').value = kingdomData.factor;
    document.getElementById('people').value = kingdomData.people_count;
    document.getElementById('happy').value = kingdomData.happy;
    document.getElementById('institut').value = kingdomData.study;
    document.getElementById('level').value = kingdomData.level;
    document.getElementById('economy_profit').value = kingdomData.profit;
    document.getElementById('economy_kazna').value = kingdomData.kazna;
    document.getElementById('economy_plus').value = kingdomData.eco_plus;
    document.getElementById('economy_minus').value = kingdomData.eco_minus;
    document.getElementById('war_unit').value = kingdomData.war;
    document.getElementById('arrow_unit').value = kingdomData.arrow;
    document.getElementById('mag_unit').value = kingdomData.mag;
    document.getElementById('town_unit').value = kingdomData.guard_tower;
    document.getElementById('war_ship_unit').value = kingdomData.war_ship;
    document.getElementById('war_ride_unit').value = kingdomData.war_ride;
    document.getElementById('weapon_unit').value = kingdomData.gun;
    document.getElementById('ship_unit').value = kingdomData.ship;
    document.getElementById('ride_unit').value = kingdomData.ride;
    document.getElementById('logic_unit').value = kingdomData.logic;
    document.getElementById('cheast_unit').value = kingdomData.warehouse;

    if (kingdomData.warehouse_level) {
        const levels = kingdomData.warehouse_level.split(',').map(Number);
        warehouseLevel1.value = levels[0] || 0;
        warehouseLevel2.value = levels[1] || 0;
        warehouseLevel3.value = levels[2] || 0;
    } else {
        warehouseLevel1.value = 0;
        warehouseLevel2.value = 0;
        warehouseLevel3.value = 0;
    }

    warehouseLevel1.dataset.previousValue = warehouseLevel1.value;
    warehouseLevel2.dataset.previousValue = warehouseLevel2.value;
    warehouseLevel3.dataset.previousValue = warehouseLevel3.value;

    if (kingdomData.avatar) {
        currentAvatar = kingdomData.avatar;
        imageArea.innerHTML = `<img src="${currentAvatar}" style="max-width:100%; max-height:100%; object-fit:contain;">`;
    }

    kingdomData.requests.forEach(req => {
        const totalWidth = 40;
        const name = req.kingdomName;
        const obj = req.object;
        const count = req.count;
        const fixed = obj.length + String(count).length + 1;
        const dashesCount = Math.max(1, totalWidth - name.length - fixed);
        const dashes = '-'.repeat(dashesCount);
        addRequestItem(`${name}${dashes}${obj}-${count}`);
    });
    checkLevel();
    syncWarehouseAndLevels();
} else {
    setDefaultValues();
}

// ---------- Экономика и запросы ----------
function updateEconomy() {
    const plusStr = economyPlus.value.trim();
    const minusStr = economyMinus.value.trim();
    const peopleVal = parseInt(people.value) || 0;
    const goldVal = parseInt(gold.value) || 1;
    const levelVal = parseInt(level.value) || 1;
    const plusParts = plusStr ? plusStr.split('+').map(s => parseInt(s.trim()) || 0) : [];
    const minusParts = minusStr ? minusStr.split('-').map(s => parseInt(s.trim()) || 0) : [];
    const sumPlus = plusParts.reduce((a, b) => a + b, 0);
    let sumMinus = minusParts.reduce((a, b) => a + b, 0);
    if (levelVal > 3 && levelVal <= 6) sumMinus *= 2;
    else if (levelVal > 6 && levelVal <= 9) sumMinus *= 3;
    else if (levelVal > 9) sumMinus *= 4;
    const profit = (peopleVal * goldVal) + sumPlus - sumMinus;
    economyProfit.value = profit;
    const currentKazna = parseInt(economyKazna.value) || 0;
    economyKazna.value = currentKazna + profit;
    economyKazna.dataset.previousValue = economyKazna.value;
}

function handleKaznaAbsolute(event) {
    const input = event.target;
    const rawValue = input.value.trim();
    if (rawValue === '') return;
    const previousValue = parseInt(input.dataset.previousValue) || 0;

    if (rawValue.startsWith('+')) {
        input.value = previousValue;
        return;
    }

    const expr = rawValue.replace(/\s/g, '');
    if (/[^0-9+\-]/.test(expr)) {
        input.value = previousValue;
        return;
    }

    const tokens = expr.match(/([+-]?\d+)/g);
    if (!tokens || tokens.length === 0) {
        input.value = previousValue;
        return;
    }

    if (tokens.length === 1) {
        input.value = previousValue;
        return;
    }

    const first = parseInt(tokens[0], 10);
    let sumRest = 0;
    for (let i = 1; i < tokens.length; i++) {
        sumRest += Math.abs(parseInt(tokens[i], 10));
    }
    let newValue = first - sumRest;
    newValue = Math.max(0, newValue);
    input.value = newValue;
    input.dataset.previousValue = newValue;
}

function checkLevel() {
    const peopleVal = parseInt(people.value) || 0;
    const institutVal = parseInt(institut.value) || 1;
    const levelVal = parseInt(level.value) || 1;
    if (peopleVal >= institutVal * 10 && levelVal < institutVal) {
        level.value = institutVal;
    }
}

function addRequest() {
    const text = requestInput.value.trim();
    if (!text) return;
    const parts = text.split(/\s+/);
    if (parts.length !== 3) {
        alert('Введите ровно три слова: имя объект количество');
        return;
    }
    const [name, obj, count] = parts;
    if (!/^\d+$/.test(count) || parseInt(count) <= 0) {
        alert('Количество должно быть положительным числом');
        return;
    }
    const totalWidth = 40;
    const fixed = obj.length + count.length + 1;
    const dashesCount = Math.max(1, totalWidth - name.length - fixed);
    const dashes = '-'.repeat(dashesCount);
    addRequestItem(`${name}${dashes}${obj}-${count}`);
    requestInput.value = '';
}

function addRequestItem(text) {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    const span = document.createElement('span');
    span.textContent = text;
    li.appendChild(span);
    const delBtn = document.createElement('button');
    delBtn.textContent = '✖';
    delBtn.className = 'btn btn-sm btn-danger';
    delBtn.onclick = (e) => {
        e.stopPropagation();
        li.remove();
    };
    li.appendChild(delBtn);
    li.addEventListener('click', (e) => {
        if (e.target === delBtn) return;
        const t = li.querySelector('span').textContent;
        const lastDash = t.lastIndexOf('-');
        if (lastDash !== -1) {
            tradeOut.value = t.substring(lastDash + 1);
            const before = t.substring(0, lastDash);
            const firstDash = before.indexOf('-');
            if (firstDash !== -1) tradeOutKingdom.value = before.substring(0, firstDash);
        }
    });
    requestOutput.appendChild(li);
}

// ---------- Сохранение ----------
async function saveKingdom() {
    const success = await performSave();
    if (success) {
        alert('Сохранено!');
        window.location.href = '/file_maneger';
    }
}

async function saveKingdomSilent() {
    return await performSave();
}

async function performSave() {
    const kingdomId = kingdomData ? kingdomData.id : null;

    if (!currentAvatar) {
        const img = document.querySelector('#image-area img');
        if (img && img.src && img.src.startsWith('data:image')) {
            currentAvatar = img.src;
        }
    }

    syncWarehouseAndLevels();

    const data = {
        id: kingdomId,
        name: document.getElementById('kingdom-name').value,
        avatar: currentAvatar || null,
        wheat: parseInt(document.getElementById('wheat').value) || 0,
        gold: parseInt(document.getElementById('gold').value) || 0,
        iron: parseInt(document.getElementById('iron').value) || 0,
        factor: parseInt(document.getElementById('factor').value) || 0,
        people_count: parseInt(document.getElementById('people').value) || 0,
        happy: parseInt(document.getElementById('happy').value) || 0,
        study: parseInt(document.getElementById('institut').value) || 0,
        level: parseInt(document.getElementById('level').value) || 0,
        profit: parseInt(document.getElementById('economy_profit').value) || 0,
        kazna: parseInt(document.getElementById('economy_kazna').value) || 0,
        eco_plus: document.getElementById('economy_plus').value,
        eco_minus: document.getElementById('economy_minus').value,
        war: parseInt(document.getElementById('war_unit').value) || 0,
        arrow: parseInt(document.getElementById('arrow_unit').value) || 0,
        mag: parseInt(document.getElementById('mag_unit').value) || 0,
        gun: parseInt(document.getElementById('weapon_unit').value) || 0,
        war_ship: parseInt(document.getElementById('war_ship_unit').value) || 0,
        war_ride: parseInt(document.getElementById('war_ride_unit').value) || 0,
        guard_tower: parseInt(document.getElementById('town_unit').value) || 0,
        ship: parseInt(document.getElementById('ship_unit').value) || 0,
        ride: parseInt(document.getElementById('ride_unit').value) || 0,
        logic: parseInt(document.getElementById('logic_unit').value) || 0,
        warehouse: parseInt(document.getElementById('cheast_unit').value) || 0,
        warehouse_level: [
            parseInt(warehouseLevel1.value) || 0,
            parseInt(warehouseLevel2.value) || 0,
            parseInt(warehouseLevel3.value) || 0
        ].join(','),
        requests: []
    };

    document.querySelectorAll('#request_output li').forEach(li => {
        const span = li.querySelector('span');
        if (span) {
            const text = span.textContent;
            const lastDash = text.lastIndexOf('-');
            if (lastDash !== -1) {
                const count = parseInt(text.substring(lastDash + 1));
                const before = text.substring(0, lastDash);
                const firstDash = before.indexOf('-');
                if (firstDash !== -1) {
                    data.requests.push({
                        kingdomName: before.substring(0, firstDash),
                        object: before.substring(firstDash + 1).replace(/-+$/, ''),
                        count: count
                    });
                }
            }
        }
    });

    try {
        const response = await fetch('/kingdom/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            const result = await response.json();
            if (kingdomData) kingdomData.id = result.id;
            return true;
        } else {
            const err = await response.json();
            alert('Ошибка сохранения: ' + (err.detail || 'Неизвестная ошибка'));
            return false;
        }
    } catch (e) {
        alert('Ошибка сети: ' + e.message);
        return false;
    }
}

// ---------- Логика складов ----------
function syncWarehouseAndLevels() {
    const l1 = parseInt(warehouseLevel1.value) || 0;
    const l2 = parseInt(warehouseLevel2.value) || 0;
    const l3 = parseInt(warehouseLevel3.value) || 0;
    const sum = l1 + l2 + l3;
    document.getElementById('cheast_unit').value = sum;
}

function redistributeWarehouses() {
    let total = parseInt(document.getElementById('cheast_unit').value) || 0;
    let l1 = parseInt(warehouseLevel1.value) || 0;
    let l2 = parseInt(warehouseLevel2.value) || 0;
    let l3 = parseInt(warehouseLevel3.value) || 0;
    let sum = l1 + l2 + l3;

    if (sum === total) return;

    if (sum < total) {
        warehouseLevel1.value = l1 + (total - sum);
    } else {
        let excess = sum - total;
        if (l3 >= excess) {
            warehouseLevel3.value = l3 - excess;
        } else {
            warehouseLevel3.value = 0;
            excess -= l3;
            if (l2 >= excess) {
                warehouseLevel2.value = l2 - excess;
            } else {
                warehouseLevel2.value = 0;
                excess -= l2;
                warehouseLevel1.value = Math.max(0, l1 - excess);
            }
        }
    }
    warehouseLevel1.dataset.previousValue = warehouseLevel1.value;
    warehouseLevel2.dataset.previousValue = warehouseLevel2.value;
    warehouseLevel3.dataset.previousValue = warehouseLevel3.value;
}

function rebalanceLevels(changedInput, newValue) {
    const oldValue = parseInt(changedInput.dataset.previousValue) || 0;
    const delta = newValue - oldValue;
    if (delta === 0) return;

    let l1 = parseInt(warehouseLevel1.value) || 0;
    let l2 = parseInt(warehouseLevel2.value) || 0;
    let l3 = parseInt(warehouseLevel3.value) || 0;

    if (changedInput.id === 'warehouse_level_2') {
        if (delta > 0) {
            if (l1 >= delta) {
                warehouseLevel1.value = l1 - delta;
            } else {
                warehouseLevel2.value = oldValue + l1;
                warehouseLevel1.value = 0;
            }
        } else {
            warehouseLevel1.value = l1 + Math.abs(delta);
        }
    } else if (changedInput.id === 'warehouse_level_3') {
        if (delta > 0) {
            if (l2 >= delta) {
                warehouseLevel2.value = l2 - delta;
            } else {
                const remaining = delta - l2;
                warehouseLevel2.value = 0;
                if (l1 >= remaining) {
                    warehouseLevel1.value = l1 - remaining;
                } else {
                    warehouseLevel3.value = oldValue + l2 + l1;
                    warehouseLevel2.value = 0;
                    warehouseLevel1.value = 0;
                }
            }
        } else {
            warehouseLevel2.value = l2 + Math.abs(delta);
        }
    }

    warehouseLevel1.dataset.previousValue = warehouseLevel1.value;
    warehouseLevel2.dataset.previousValue = warehouseLevel2.value;
    warehouseLevel3.dataset.previousValue = warehouseLevel3.value;
    syncWarehouseAndLevels();
}

function validateWarehouseLevels(inputElement) {
    const newValue = parseInt(inputElement.value) || 0;
    if (inputElement.id === 'warehouse_level_1') {
        syncWarehouseAndLevels();
    } else {
        rebalanceLevels(inputElement, newValue);
    }
    inputElement.dataset.previousValue = inputElement.value;
}

// ---------- Арифметика для остальных полей (не казна) ----------
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
    if (input.id === 'economy_kazna') return;

    const rawValue = input.value.trim();
    if (rawValue === '') return;
    let currentValue = parseInt(rawValue, 10);
    if (isNaN(currentValue)) currentValue = 0;
    const newValue = parseArithmeticExpression(rawValue, currentValue);
    if (!isNaN(newValue)) {
        input.value = newValue;
        if (input.id === 'people' || input.id === 'institut') checkLevel();
        if (input.id === 'cheast_unit') {
            redistributeWarehouses();
        }
        if (input.id === 'warehouse_level_1' || input.id === 'warehouse_level_2' || input.id === 'warehouse_level_3') {
            validateWarehouseLevels(input);
        }
    } else {
        input.value = currentValue;
    }
}

function setupFieldEditing() {
    const allInputs = document.querySelectorAll('input');
    const excludeIds = ['economy_plus', 'economy_minus', 'kingdom-name', 'request_input', 'tools', 'weapons', 'economy_kazna'];
    allInputs.forEach(input => {
        if (input.hasAttribute('readonly')) return;
        if (excludeIds.includes(input.id)) return;
        input.removeEventListener('blur', handleFieldEdit);
        input.addEventListener('blur', handleFieldEdit);
        if (input.id === 'warehouse_level_1' || input.id === 'warehouse_level_2' || input.id === 'warehouse_level_3') {
            input.dataset.previousValue = input.value;
            input.addEventListener('focus', function() {
                this.dataset.previousValue = this.value;
            });
        }
    });
}

// ---------- Обработчики событий ----------
updateEconomyBtn.addEventListener('click', updateEconomy);
economyKazna.addEventListener('blur', handleKaznaAbsolute);
economyKazna.addEventListener('focus', function() {
    this.dataset.previousValue = this.value;
});
people.addEventListener('input', checkLevel);
institut.addEventListener('input', checkLevel);
addRequestBtn.addEventListener('click', addRequest);
loadImageBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
        if (e.target.files[0]) loadImageAsBase64(e.target.files[0]);
    };
    input.click();
});
document.getElementById('saveBtn').addEventListener('click', saveKingdom);
document.getElementById('goToWarehouseBtn').addEventListener('click', async () => {
    const saved = await saveKingdomSilent();
    if (saved && kingdomData && kingdomData.id) {
        window.location.href = `/warehouse?kingdom_id=${kingdomData.id}`;
    }
});
document.getElementById('goToTechBtn').addEventListener('click', async () => {
    const saved = await saveKingdomSilent();
    if (saved && kingdomData && kingdomData.id) {
        window.location.href = `/technology?kingdom_id=${kingdomData.id}`;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    setupFieldEditing();
    if (kingdomData) {
        syncWarehouseAndLevels();
    }
    if (economyKazna) {
        economyKazna.dataset.previousValue = economyKazna.value;
    }
});
