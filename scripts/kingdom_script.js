let currentAvatar = null;

function setDefaultValues() {
    document.getElementById('kingdom-name').value = 'Моё королевство';
    document.getElementById('wheat').value = 30;
    document.getElementById('gold').value = 1;
    document.getElementById('iron').value = 0;
    document.getElementById('factor').value = 20;
    document.getElementById('tools').value = 0;
    document.getElementById('weapons').value = 0;
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

// Получаем элементы DOM
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

if (kingdomData) {
    // Заполнение полей
    document.getElementById('kingdom-name').value = kingdomData.name;
    document.getElementById('wheat').value = kingdomData.wheat;
    document.getElementById('gold').value = kingdomData.gold;
    document.getElementById('iron').value = kingdomData.iron;
    document.getElementById('factor').value = kingdomData.factor;
    document.getElementById('tools').value = kingdomData.tools;
    document.getElementById('weapons').value = kingdomData.weapons;
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
} else {
    setDefaultValues();
}

// ---------- Функции экономики, запросов и т.д. ----------
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
}

function onKaznaEdit() {
    // заглушка – можно оставить как есть
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

// ---------- Сохранение (ГЛАВНОЕ) ----------
async function saveKingdom() {
    const kingdomId = kingdomData ? kingdomData.id : null;

    // ★★★★★ FALLBACK: если currentAvatar пуст, но изображение отображается, извлекаем его src
    if (!currentAvatar) {
        const img = document.querySelector('#image-area img');
        if (img && img.src && img.src.startsWith('data:image')) {
            currentAvatar = img.src;
            console.log('Avatar извлечён из DOM, длина:', currentAvatar.length);
        }
    }

    const data = {
        id: kingdomId,
        name: document.getElementById('kingdom-name').value,
        avatar: currentAvatar || null,
        wheat: parseInt(document.getElementById('wheat').value) || 0,
        gold: parseInt(document.getElementById('gold').value) || 0,
        iron: parseInt(document.getElementById('iron').value) || 0,
        factor: parseInt(document.getElementById('factor').value) || 0,
        tools: parseInt(document.getElementById('tools').value) || 0,
        weapons: parseInt(document.getElementById('weapons').value) || 0,
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
        requests: []
    };

    // Сбор запросов (без изменений)
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

    console.log('Отправка avatar:', data.avatar ? `да (длина ${data.avatar.length})` : 'НЕТ');
    const response = await fetch('/kingdom/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        alert('Сохранено!');
        window.location.href = '/file_maneger';
    } else {
        const err = await response.json();
        alert('Ошибка: ' + (err.detail || 'Неизвестная ошибка'));
    }
}

// Назначение обработчиков
updateEconomyBtn.addEventListener('click', updateEconomy);
economyKazna.addEventListener('blur', onKaznaEdit);
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

// Дополнительная функция для редактирования полей (можно опустить, но пусть будет)
function setupFieldEditing() {
    const inputs = document.querySelectorAll('input');
    const exclude = ['economy_plus', 'economy_minus', 'economy_kazna', 'kingdom-name', 'request_input'];
    inputs.forEach(inp => {
        if (!inp.hasAttribute('readonly') && !exclude.includes(inp.id)) {
            inp.addEventListener('blur', (e) => {
                let val = parseInt(e.target.value);
                if (!isNaN(val)) e.target.value = val;
                if (e.target.id === 'people' || e.target.id === 'institut') checkLevel();
            });
        }
    });
}
setupFieldEditing();
