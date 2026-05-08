// Получаем элементы
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

// Заполнение полей при загрузке существующего королевства
if (kingdomData) {
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

    // Заполняем запросы
    kingdomData.requests.forEach(req => {
        const totalWidth = 40;
        const name = req.kingdomName;
        const obj = req.object;
        const count = req.count;
        const fixed = obj.length + String(count).length + 1;
        const dashesCount = Math.max(1, totalWidth - name.length - fixed);
        const dashes = '-'.repeat(dashesCount);
        const formatted = `${name}${dashes}${obj}-${count}`;
        addRequestItem(formatted);
    });
    checkLevel();
}

// ---------- Функции ----------
// Функция сохранения
async function saveKingdom() {
    const kingdomId = kingdomData ? kingdomData.id : null;

    // Сбор данных с формы
    const data = {
        id: kingdomId,
        name: document.getElementById('kingdom-name').value,
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

    // Сбор запросов из списка
    document.querySelectorAll('#request_output li').forEach(li => {
        const span = li.querySelector('span');
        if (span) {
            const text = span.textContent;
            // Парсим как в onRequestClick
            const lastDash = text.lastIndexOf('-');
            if (lastDash !== -1) {
                const count = parseInt(text.substring(lastDash + 1));
                const before = text.substring(0, lastDash);
                const firstDash = before.indexOf('-');
                if (firstDash !== -1) {
                    const kingdomName = before.substring(0, firstDash);
                    const object = before.substring(firstDash + 1).replace(/-+$/, '');
                    data.requests.push({ kingdomName, object, count });
                }
            }
        }
    });

    const response = await fetch('/kingdom/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        const result = await response.json();
        alert('Королевство сохранено');
        window.location.href = '/file_maneger';
    } else {
        alert('Ошибка при сохранении');
    }
}

// Истинное значение казны (для сложного редактирования)
let trueKazna = 0;

// Обновление экономики (аналог update_economy)
function updateEconomy() {
    const plusStr = economyPlus.value.trim();
    const minusStr = economyMinus.value.trim();
    const peopleVal = parseInt(people.value) || 0;
    const goldVal = parseInt(gold.value) || 1;
    const levelVal = parseInt(level.value) || 1;

    // Парсинг плюсов (разделитель '+')
    const plusParts = plusStr ? plusStr.split('+').map(s => parseInt(s.trim()) || 0) : [];
    const minusParts = minusStr ? minusStr.split('-').map(s => parseInt(s.trim()) || 0) : [];

    const sumPlus = plusParts.reduce((a, b) => a + b, 0);
    let sumMinus = minusParts.reduce((a, b) => a + b, 0);

    // Множители уровня
    if (levelVal > 3 && levelVal <= 6) sumMinus *= 2;
    else if (levelVal > 6 && levelVal <= 9) sumMinus *= 3;
    else if (levelVal > 9) sumMinus *= 4;

    const profit = (peopleVal * goldVal) + sumPlus - sumMinus;
    economyProfit.value = profit;

    const currentKazna = parseInt(economyKazna.value) || 0;
    const newKazna = currentKazna + profit;
    economyKazna.value = newKazna;
    trueKazna = newKazna;
}

// Редактирование казны (аналог on_economy_kazna_edited)
function onKaznaEdit() {
    const text = economyKazna.value.trim();
    if (!text) {
        economyKazna.value = trueKazna;
        return;
    }
    try {
        // Разделяем по '+' и '-' (заменяем '+' на '-', затем split)
        const expr = text.replace(/\s+/g, '').replace(/\+/g, '-');
        const parts = expr.split('-').map(p => parseInt(p) || 0);
        // Ищем индекс, где значение равно старой казне
        const index = parts.indexOf(trueKazna);
        if (index !== -1) parts.splice(index, 1);
        const sum = parts.reduce((a, b) => a + b, 0);
        trueKazna = trueKazna - sum;
        economyKazna.value = trueKazna;
    } catch (e) {
        economyKazna.value = trueKazna;
    }
}

// Проверка уровня (people == institut * 10)
function checkLevel() {
    const peopleVal = parseInt(people.value) || 0;
    const institutVal = parseInt(institut.value) || 1;
    const levelVal = parseInt(level.value) || 1;
    if (peopleVal >= institutVal * 10 && levelVal < institutVal) {
        level.value = institutVal;
    }
}

// Добавление запроса
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
    // Форматирование как в PyQt: name---object-count
    const totalWidth = 40;
    const fixed = obj.length + count.length + 1; // object-count
    const dashesCount = Math.max(1, totalWidth - name.length - fixed);
    const dashes = '-'.repeat(dashesCount);
    const formatted = `${name}${dashes}${obj}-${count}`;
    addRequestItem(formatted);
    requestInput.value = '';
}

function addRequestItem(text) {
    const li = document.createElement('li');

    // Текст запроса
    const span = document.createElement('span');
    span.textContent = text;
    li.appendChild(span);

    // Кнопка удаления (крестик)
    const delBtn = document.createElement('button');
    delBtn.textContent = '✖';
    delBtn.classList.add('delete-request');
    delBtn.setAttribute('aria-label', 'Удалить запрос');
    delBtn.onclick = (e) => {
        e.stopPropagation(); // не допускаем всплытия, чтобы не сработал клик по li
        li.remove();
    };
    li.appendChild(delBtn);

    // Клик по элементу (заполнение полей торговли)
    li.addEventListener('click', (e) => {
        // Если клик был точно по крестику, уже обработано выше
        if (e.target === delBtn) return;
        onRequestClick(li);
    });

    requestOutput.appendChild(li);
}

// Клик по запросу
function onRequestClick(item) {
    const text = item.textContent;
    const lastDash = text.lastIndexOf('-');
    if (lastDash === -1) return;
    const count = text.substring(lastDash + 1);
    const before = text.substring(0, lastDash);
    const firstDash = before.indexOf('-');
    if (firstDash === -1) return;
    const name = before.substring(0, firstDash);
    const objectName = before.substring(firstDash + 1).replace(/-+$/, '');
    tradeOutKingdom.value = name;
    tradeOut.value = count;
}

    // Загрузка изображения через FileReader
function loadImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        imageArea.innerHTML = `<img src="${e.target.result}" alt="герб">`;
    };
    reader.readAsDataURL(file);
}

// ---------- Обработчики событий ----------
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
        const file = e.target.files[0];
        if (file) loadImage(file);
    };
    input.click();
});

// Добавляем обработчик на кнопку "Сохранить"
document.getElementById('saveBtn').addEventListener('click', async () => {
    const btn = document.getElementById('saveBtn');
    btn.classList.add('saving');
    try {
        await saveKingdom();
    } finally {
        btn.classList.remove('saving');
    }
});

function parseArithmeticExpression(inputStr, currentValue) {
    if (!inputStr) return currentValue;
    // Убираем пробелы
    let str = inputStr.replace(/\s+/g, '');
    if (str === '') return currentValue;

    const firstChar = str[0];
    const isRelative = (firstChar === '+' || firstChar === '-');

    // Ищем все числа со знаками
    const tokens = str.match(/[+-]?\d+/g);
    if (!tokens) return currentValue;

    let sum = 0;
    for (let token of tokens) {
        let num = parseInt(token, 10);
        if (!isNaN(num)) sum += num;
    }

    return isRelative ? currentValue + sum : sum;
}

/**
 * Обработчик события blur для редактируемых полей.
 */
function handleFieldEdit(event) {
    const input = event.target;
    const currentValue = parseInt(input.value) || 0;
    const newValue = parseArithmeticExpression(input.value, currentValue);

    if (!isNaN(newValue)) {
        input.value = newValue;

        // Специальные проверки для полей, влияющих на уровень
        if (input.id === 'people' || input.id === 'institut') {
            checkLevel();
        }
    }
}

/**
 * Навешивает обработчики на все подходящие поля ввода.
 */
function setupFieldEditing() {
    const allInputs = document.querySelectorAll('input');
    const excludeIds = ['economy_plus', 'economy_minus', 'economy_kazna', 'kingdom-name', 'request_input'];

    allInputs.forEach(input => {
        // Пропускаем поля только для чтения
        if (input.hasAttribute('readonly')) return;
        // Пропускаем исключённые по id
        if (excludeIds.includes(input.id)) return;

        input.addEventListener('blur', handleFieldEdit);
    });
}

// Вызываем после загрузки страницы (элементы уже существуют)
setupFieldEditing();
