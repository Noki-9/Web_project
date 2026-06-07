from fastapi import FastAPI, Request, Depends, HTTPException, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from starlette.middleware.sessions import SessionMiddleware
from database import engine, session_local
from Forms import Base, UserAccount, Kingdom, Request_db, WarehouseItem, TechResearch
from datetime import datetime
import bcrypt

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount('/scripts', StaticFiles(directory="scripts"), name="scripts")
app.add_middleware(SessionMiddleware, secret_key="8794561324")
templates = Jinja2Templates(directory="templates")

Base.metadata.create_all(engine)


def get_db():
    db = session_local()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))


@app.get("/")
async def home(request: Request, error: str = None, login: str = None):
    return templates.TemplateResponse("index.html", {"request": request, "error": error, "login": login})


@app.get("/reg")
async def show_registration(request: Request, error: str = None, login: str = None):
    return templates.TemplateResponse("reg.html", {"request": request, "error": error, "login": login})


@app.post("/reg")
async def show_registration_post(request: Request, error: str = None, login: str = None):
    return templates.TemplateResponse("reg.html", {"request": request, "error": error, "login": login})


@app.get("/file_maneger", response_class=HTMLResponse)
async def file_maneger(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id:
        return RedirectResponse(url="/", status_code=303)
    user = db.query(UserAccount).filter(UserAccount.id == user_id).first()
    if not user:
        request.session.clear()
        return RedirectResponse(url="/", status_code=303)
    return templates.TemplateResponse("file_maneger.html", {"request": request, "kingdoms": user.kingdoms})


@app.get("/profile", response_class=HTMLResponse)
async def profile(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id:
        return RedirectResponse(url="/", status_code=303)
    user = db.query(UserAccount).filter(UserAccount.id == user_id).first()
    if not user:
        request.session.clear()
        return RedirectResponse(url="/", status_code=303)
    kingdoms = user.kingdoms
    best = max(kingdoms, key=lambda k: (k.level or 0, k.gold or 0)) if kingdoms else None
    return templates.TemplateResponse("profile.html", {
        "request": request,
        "username": user.username,
        "total_kingdoms": len(kingdoms),
        "best_kingdom": best,
        "last_login": user.last_login.strftime("%Y-%m-%d %H:%M:%S") if user.last_login else "Никогда"
    })


@app.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/", status_code=303)


@app.post("/login")
async def login(request: Request, Login: str = Form(None), password: str = Form(None), db: Session = Depends(get_db)):
    if not Login or not password:
        return RedirectResponse(url="/?error=Заполните все поля", status_code=303)
    user = db.query(UserAccount).filter(UserAccount.username == Login).first()
    if not user or not verify_password(password, user.password):
        return RedirectResponse(url=f"/?error=Неверное имя пользователя или пароль&login={Login}", status_code=303)
    user.last_login = datetime.now()
    db.commit()
    request.session['user_id'] = user.id
    return RedirectResponse(url="/file_maneger", status_code=303)


@app.post("/file_maneger/reg")
async def file_reg(request: Request, Login: str = Form(None), password: str = Form(None),
                   password_correct: str = Form(None), db: Session = Depends(get_db)):
    if not Login or not password or not password_correct:
        return RedirectResponse(url="/reg?error=Заполните все поля", status_code=303)
    if password != password_correct:
        return RedirectResponse(url=f"/reg?error=Пароли не совпадают&login={Login}", status_code=303)
    if db.query(UserAccount).filter(UserAccount.username == Login).first():
        return RedirectResponse(url=f"/reg?error=Пользователь уже существует&login={Login}", status_code=303)
    new_user = UserAccount(username=Login, password=hash_password(password), last_login=datetime.now())
    db.add(new_user)
    db.commit()
    request.session['user_id'] = new_user.id
    return RedirectResponse(url="/file_maneger", status_code=303)


@app.get("/kingdom", response_class=HTMLResponse)
async def kingdom_page(request: Request, kingdom_id: int = None, db: Session = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id:
        return RedirectResponse(url="/", status_code=303)
    kingdom_data = None
    if kingdom_id:
        kingdom = db.query(Kingdom).filter(Kingdom.id == kingdom_id, Kingdom.user_id == user_id).first()
        if kingdom:
            kingdom_data = {
                'id': kingdom.id, 'name': kingdom.name, 'avatar': kingdom.avatar,
                'wheat': kingdom.wheat, 'gold': kingdom.gold, 'iron': kingdom.iron,
                'factor': kingdom.factor,
                'people_count': kingdom.people_count, 'happy': kingdom.happy, 'study': kingdom.study,
                'level': kingdom.level, 'profit': kingdom.profit, 'kazna': kingdom.kazna,
                'eco_plus': kingdom.eco_plus, 'eco_minus': kingdom.eco_minus,
                'war': kingdom.war, 'arrow': kingdom.arrow, 'mag': kingdom.mag, 'gun': kingdom.gun,
                'war_ship': kingdom.war_ship, 'war_ride': kingdom.war_ride, 'guard_tower': kingdom.guard_tower,
                'ship': kingdom.ship, 'ride': kingdom.ride, 'logic': kingdom.logic, 'warehouse': kingdom.warehouse,
                'warehouse_level': kingdom.warehouse_level,
                'requests': [{'kingdomName': r.kingdomName, 'object': r.object, 'count': r.count} for r in
                             kingdom.requests]
            }
    return templates.TemplateResponse("kingdom.html", {"request": request, "kingdom": kingdom_data})


@app.post("/kingdom/save")
async def save_kingdom(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id:
        raise HTTPException(401, "Не авторизован")

    data = await request.json()
    kingdom_id = data.get('id')
    kingdom_name = data.get('name')

    if not kingdom_id:
        existing = db.query(Kingdom).filter(
            Kingdom.user_id == user_id,
            Kingdom.name == kingdom_name
        ).first()
        if existing:
            raise HTTPException(400, "Королевство с таким именем уже существует")

    required = [
        'name', 'wheat', 'gold', 'iron', 'factor',
        'people_count', 'happy', 'study', 'level', 'profit', 'kazna',
        'eco_plus', 'eco_minus', 'war', 'arrow', 'mag', 'gun',
        'war_ship', 'war_ride', 'guard_tower', 'ship', 'ride',
        'logic', 'warehouse', 'warehouse_level'
    ]
    for f in required:
        if f not in data:
            raise HTTPException(400, f"Отсутствует поле {f}")

    avatar = data.get('avatar')

    try:
        if kingdom_id:
            kingdom = db.query(Kingdom).filter(Kingdom.id == kingdom_id, Kingdom.user_id == user_id).first()
            if not kingdom:
                raise HTTPException(404, "Королевство не найдено")
            for f in required:
                setattr(kingdom, f, data[f])
            kingdom.avatar = avatar
            db.query(Request_db).filter(Request_db.kingdom_id == kingdom_id).delete()
        else:
            kwargs = {f: data[f] for f in required}
            kingdom = Kingdom(user_id=user_id, avatar=avatar, **kwargs)
            db.add(kingdom)
            db.flush()
            kingdom_id = kingdom.id

        for req in data.get('requests', []):
            db.add(
                Request_db(kingdom_id=kingdom_id, kingdomName=req['kingdomName'], object=req['object'],
                           count=req['count'])
            )
        db.commit()
    except IntegrityError as e:
        db.rollback()
        if "UNIQUE constraint failed: kingdoms.user_id, kingdoms.name" in str(e.orig):
            raise HTTPException(400, "Королевство с таким именем уже существует")
        else:
            raise HTTPException(400, f"Ошибка базы данных: {str(e)}")

    return {"status": "ok", "id": kingdom_id}


@app.delete("/kingdom/{kingdom_id}")
async def delete_kingdom(kingdom_id: int, request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id:
        raise HTTPException(401, "Не авторизован")
    kingdom = db.query(Kingdom).filter(Kingdom.id == kingdom_id, Kingdom.user_id == user_id).first()
    if not kingdom:
        raise HTTPException(404, "Королевство не найдено")
    db.delete(kingdom)
    db.commit()
    return {"status": "ok"}


@app.get("/warehouse", response_class=HTMLResponse)
async def warehouse_page(request: Request, kingdom_id: int, db: Session = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id:
        return RedirectResponse(url="/", status_code=303)
    kingdom = db.query(Kingdom).filter(Kingdom.id == kingdom_id, Kingdom.user_id == user_id).first()
    if not kingdom:
        raise HTTPException(404, "Королевство не найдено")
    kingdom_data = {
        'id': kingdom.id,
        'name': kingdom.name,
        'warehouse': kingdom.warehouse,
        'warehouse_level': kingdom.warehouse_level,
        'items': [{
            'name': item.name,
            'count': item.count,
            'storage_type': item.storage_type
        } for item in kingdom.warehouse_items]
    }
    return templates.TemplateResponse("warehouse.html", {"request": request, "kingdom": kingdom_data})


@app.post("/warehouse/save")
async def save_warehouse(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id:
        raise HTTPException(401, "Не авторизован")
    data = await request.json()
    kingdom_id = data.get('kingdom_id')
    if not kingdom_id:
        raise HTTPException(400, "Отсутствует kingdom_id")
    kingdom = db.query(Kingdom).filter(Kingdom.id == kingdom_id, Kingdom.user_id == user_id).first()
    if not kingdom:
        raise HTTPException(404, "Королевство не найдено")

    levels = data.get('warehouse_level', [0, 0, 0])
    total_warehouses = kingdom.warehouse or 0
    if sum(levels) > total_warehouses:
        raise HTTPException(400, "Количество складов по уровням превышает общее количество складов")
    kingdom.warehouse_level = ','.join(map(str, levels))

    capacity = sum(l * mult for l, mult in zip(levels, [5, 10, 20]))

    db.query(WarehouseItem).filter(WarehouseItem.kingdom_id == kingdom_id).delete()

    total_items = 0
    items_data = data.get('items', [])
    for item in items_data:
        name = item.get('name')
        count = item.get('count', 0)
        storage_type = item.get('storage_type', 'single')
        if not name or count <= 0:
            continue
        space_used = count if storage_type == 'single' else (count + 9) // 10
        total_items += space_used
        if total_items > capacity:
            raise HTTPException(400,
                                f"Недостаточно места на складе для размещения {name}. Требуется {space_used} мест, доступно {capacity - (total_items - space_used)}")
        db.add(WarehouseItem(
            kingdom_id=kingdom_id,
            name=name,
            count=count,
            storage_type=storage_type
        ))

    if total_items > capacity:
        raise HTTPException(400, "Общее количество ресурсов превышает вместимость склада")
    db.commit()
    return {"status": "ok", "id": kingdom_id}


# ---------- ТЕХНОЛОГИИ ----------

def get_research_packs_count(kingdom: Kingdom, db: Session) -> int:
    item = db.query(WarehouseItem).filter(
        WarehouseItem.kingdom_id == kingdom.id,
        WarehouseItem.name == 'исследовательский пакет'
    ).first()
    return item.count if item else 0


def get_diamonds_count(kingdom: Kingdom, db: Session) -> int:
    item = db.query(WarehouseItem).filter(
        WarehouseItem.kingdom_id == kingdom.id,
        WarehouseItem.name == 'бриллиант'
    ).first()
    return item.count if item else 0


def consume_item(kingdom: Kingdom, item_name: str, amount: int, db: Session) -> bool:
    if amount <= 0:
        return True
    item = db.query(WarehouseItem).filter(
        WarehouseItem.kingdom_id == kingdom.id,
        WarehouseItem.name == item_name
    ).first()
    if not item or item.count < amount:
        return False
    item.count -= amount
    if item.count == 0:
        db.delete(item)
    db.flush()
    return True


def has_two_level10_skill(kingdom: Kingdom, db: Session) -> bool:
    skill = db.query(TechResearch).filter(
        TechResearch.kingdom_id == kingdom.id,
        TechResearch.tree == 'special',
        TechResearch.level == 10,
        TechResearch.variant == 'two_level10'
    ).first()
    return skill is not None


def count_level10_researches(kingdom: Kingdom, db: Session) -> int:
    count = db.query(TechResearch).filter(
        TechResearch.kingdom_id == kingdom.id,
        TechResearch.level == 10,
        TechResearch.tree.in_(['trade', 'military', 'management'])
    ).count()
    return count


TECH_TREES = {
    'trade': {
        1: {'name': 'Склад', 'variant': None, 'multiple': False},
        2: {'name': 'Корабль и транспорт', 'variants': ['ship', 'transport'], 'multiple': True},
        3: {'name': 'Логистический центр и назначение цен', 'variants': ['logistics_center', 'price_setting'],
            'multiple': True},
        4: {'name': 'Склад 2 / Транспорт 2', 'variants': ['warehouse2', 'transport2'], 'multiple': False},
        5: {'name': 'Контракты и торговля военными', 'variants': ['contracts', 'military_trade'], 'multiple': True},
        6: {'name': 'Торговля акциями', 'variant': None, 'multiple': False},
        7: {'name': 'Склад 3 / Транспорт 3', 'variants': ['warehouse3', 'transport3'], 'multiple': False},
        8: {'name': 'Ювелир', 'variant': None, 'multiple': False},
        9: {'name': 'Экономика +50%', 'variant': None, 'multiple': False},
        10: {'name': 'Склад 3 / Транспорт 3', 'variants': ['warehouse3', 'transport3'], 'multiple': False},
    },
    'military': {
        1: {'name': 'Казарма и форт', 'variants': ['barracks', 'fort'], 'multiple': True},
        2: {'name': 'Захват и оборона', 'variants': ['capture', 'defense'], 'multiple': True},
        3: {'name': 'Лучники и военный транспорт', 'variants': ['archers', 'war_transport'], 'multiple': True},
        4: {'name': 'Увеличение отряда 6 / Два командира', 'variants': ['squad6', 'two_commanders'], 'multiple': False},
        5: {'name': 'Форт 2 / Военный транспорт 2', 'variants': ['fort2', 'war_transport2'], 'multiple': False},
        6: {'name': 'Увеличение отряда 9 / Инициатива +1', 'variants': ['squad9', 'initiative1'], 'multiple': False},
        7: {'name': 'Форт 3 / Инициатива +1', 'variants': ['fort3', 'initiative1_2'], 'multiple': False},
        8: {'name': 'Генерал / Пушка', 'variants': ['general', 'cannon'], 'multiple': False},
        9: {'name': 'Увеличение отряда 12 / Инициатива +5', 'variants': ['squad12', 'initiative5'], 'multiple': False},
        10: {'name': 'Артиллерия', 'variant': None, 'multiple': False},
    },
    'management': {
        1: {'name': 'Заводы', 'variant': None, 'multiple': False},
        2: {'name': 'Нория и резервар', 'variants': ['noria', 'reservoir'], 'multiple': True},
        3: {'name': 'Обработка железа и кузница', 'variants': ['iron_processing', 'smithy'], 'multiple': True},
        4: {'name': 'Заселение леса / Убрать скалы', 'variants': ['forest_settlement', 'remove_rocks'],
            'multiple': False},
        5: {'name': 'Создание столиц / Жильё на воде', 'variants': ['capitals', 'water_housing'], 'multiple': False},
        6: {'name': 'Рыбный промысел / Колонизация 4×4', 'variants': ['fishing', 'colonization'], 'multiple': False},
        7: {'name': 'Предприятия 2 / Шахта', 'variants': ['enterprises2', 'mine'], 'multiple': False},
        8: {'name': 'Жилищный вопрос / Военные городки', 'variants': ['housing', 'military_towns'], 'multiple': False},
        9: {'name': 'Внешняя политика / Внутренняя политика', 'variants': ['foreign_policy', 'domestic_policy'],
            'multiple': True},
        10: {'name': 'Присвоение несмежных территорий', 'variant': None, 'multiple': False},
    },
    'special': {
        1: {'name': 'Максимальное золото 4', 'variant': None, 'multiple': False},
        2: {'name': 'Максимальное золото 6', 'variant': None, 'multiple': False},
        3: {'name': 'Цена на армию / Цены на торговлю / Цены на исследование',
            'variants': ['army_price', 'trade_prices', 'research_prices'], 'multiple': False},
        4: {'name': 'Содержание армии / Продажа по более выгодной цене / Содержание института',
            'variants': ['army_upkeep', 'better_sell', 'institute_upkeep'], 'multiple': False},
        5: {'name': 'Снижение цены рекрутов / Больше места в складах / Возврат 20% с покупки',
            'variants': ['recruit_cost', 'more_storage', 'cashback20'], 'multiple': False},
        6: {'name': 'Мобильность армии / +20% к товарам / Возможность изучить второй навык',
            'variants': ['army_mobility', 'goods_bonus', 'second_skill'], 'multiple': False},
        7: {'name': 'Снижение цены рекрутов 2 / Алмазы 2 / Содержание институтов 1',
            'variants': ['recruit_cost2', 'diamonds2', 'institute_upkeep1'], 'multiple': False},
        8: {'name': 'Создание армий / Дорогая продажа 2 / Кешбек 50%',
            'variants': ['create_armies', 'expensive_sell2', 'cashback50'], 'multiple': False},
        9: {'name': 'Бонус форта 2 / Дешёвая обработка / Уровень +1',
            'variants': ['fort_bonus2', 'cheap_processing', 'level_up1'], 'multiple': False},
        10: {'name': '3 генерала / Покупка без бриллиантов / 2 навыка 10 уровня',
             'variants': ['three_generals', 'no_diamonds_buy', 'two_level10'], 'multiple': False},
    }
}


def get_tech_status(kingdom: Kingdom, tree: str, db: Session):
    researches = db.query(TechResearch).filter(
        TechResearch.kingdom_id == kingdom.id,
        TechResearch.tree == tree
    ).all()
    status = {}
    for r in researches:
        if r.level not in status:
            status[r.level] = {'learned': False, 'variants': []}
        status[r.level]['variants'].append(r.variant)
        status[r.level]['learned'] = True
    max_level = max(TECH_TREES[tree].keys())
    for lvl in range(1, max_level + 1):
        if lvl not in status:
            status[lvl] = {'learned': False, 'variants': []}
    return status


def can_learn(kingdom: Kingdom, tree: str, level: int, variant: str | None, db: Session):
    tech_info = TECH_TREES[tree].get(level)
    if not tech_info:
        return False, "Неизвестный уровень технологии"

    # Ограничение на 10 уровень для обычных деревьев
    if level == 10 and tree in ('trade', 'military', 'management'):
        current_count = count_level10_researches(kingdom, db)
        max_allowed = 2 if has_two_level10_skill(kingdom, db) else 1
        if current_count >= max_allowed:
            return False, f"Можно изучить не более {max_allowed} навык(ов) 10 уровня (всего) в обычных деревьях"

    if 'variants' in tech_info and variant is None:
        return False, "Для этого навыка требуется выбрать вариант"
    if 'variants' not in tech_info:
        variant = None

    if variant is not None:
        existing = db.query(TechResearch).filter(
            TechResearch.kingdom_id == kingdom.id,
            TechResearch.tree == tree,
            TechResearch.level == level,
            TechResearch.variant == variant
        ).first()
        if existing:
            return False, "Этот навык уже изучен"
    else:
        existing = db.query(TechResearch).filter(
            TechResearch.kingdom_id == kingdom.id,
            TechResearch.tree == tree,
            TechResearch.level == level
        ).first()
        if existing:
            return False, "Этот навык уже изучен"

    if not tech_info.get('multiple', False) and tech_info.get('variants'):
        any_learned = db.query(TechResearch).filter(
            TechResearch.kingdom_id == kingdom.id,
            TechResearch.tree == tree,
            TechResearch.level == level
        ).first()
        if any_learned:
            return False, "На этом уровне можно изучить только один навык"

    if level > 1:
        prev_learned = db.query(TechResearch).filter(
            TechResearch.kingdom_id == kingdom.id,
            TechResearch.tree == tree,
            TechResearch.level == level - 1
        ).first()
        if not prev_learned:
            return False, "Требуется изучить предыдущий уровень"

    if kingdom.level < level:
        return False, f"Требуется уровень королевства {level}"

    cost = level * 10
    if kingdom.kazna < cost:
        return False, f"Недостаточно золота. Нужно {cost}"

    if level >= 7:
        packs = get_research_packs_count(kingdom, db)
        if packs < 1:
            return False, "Для изучения технологии 7+ уровня требуется исследовательский пакет"

    if level == 10:
        diamonds = get_diamonds_count(kingdom, db)
        if diamonds < 1:
            return False, "Для изучения технологии 10 уровня требуется бриллиант"

    # Обработка особого дерева (ветвление)
    if tree == 'special' and level >= 3:
        if variant is None:
            return False, "Требуется выбрать вариант"
        variants_list = tech_info['variants']
        if variant not in variants_list:
            return False, "Неверный вариант"

        if level == 3:
            # Любой вариант разрешён
            pass
        else:
            level3 = db.query(TechResearch).filter(
                TechResearch.kingdom_id == kingdom.id,
                TechResearch.tree == 'special',
                TechResearch.level == 3
            ).first()
            if not level3:
                return False, "Сначала изучите уровень 3 особого дерева"
            level3_variants = TECH_TREES['special'][3]['variants']
            if level3.variant not in level3_variants:
                return False, "Ошибка данных ветвления"
            branch_idx = level3_variants.index(level3.variant)
            # Требуемый вариант на текущем уровне должен иметь тот же индекс
            if branch_idx >= len(variants_list):
                return False, "Нет варианта для этой ветви"
            required_variant = variants_list[branch_idx]
            if variant != required_variant:
                return False, "Нельзя сменить ветвь особого дерева"

        if level > 3:
            prev_tech = db.query(TechResearch).filter(
                TechResearch.kingdom_id == kingdom.id,
                TechResearch.tree == 'special',
                TechResearch.level == level - 1
            ).first()
            if not prev_tech:
                return False, f"Требуется изучить уровень {level - 1} в этой ветви"

    return True, ""


@app.get("/technology", response_class=HTMLResponse)
async def technology_page(request: Request, kingdom_id: int, db: Session = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id:
        return RedirectResponse(url="/", status_code=303)
    kingdom = db.query(Kingdom).filter(Kingdom.id == kingdom_id, Kingdom.user_id == user_id).first()
    if not kingdom:
        raise HTTPException(404, "Королевство не найдено")

    statuses = {}
    for tree in TECH_TREES.keys():
        statuses[tree] = get_tech_status(kingdom, tree, db)

    return templates.TemplateResponse("technology.html", {
        "request": request,
        "kingdom": kingdom,
        "tech_trees": TECH_TREES,
        "statuses": statuses
    })


@app.post("/technology/learn")
async def learn_technology(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id:
        raise HTTPException(401, "Не авторизован")
    data = await request.json()
    kingdom_id = data.get('kingdom_id')
    tree = data.get('tree')
    level = data.get('level')
    variant = data.get('variant')

    if not kingdom_id or not tree or not level:
        raise HTTPException(400, "Не хватает параметров")

    kingdom = db.query(Kingdom).filter(Kingdom.id == kingdom_id, Kingdom.user_id == user_id).first()
    if not kingdom:
        raise HTTPException(404, "Королевство не найдено")

    can, msg = can_learn(kingdom, tree, level, variant, db)
    if not can:
        raise HTTPException(400, msg)

    cost = level * 10
    kingdom.kazna -= cost
    if level >= 7:
        if not consume_item(kingdom, 'исследовательский пакет', 1, db):
            raise HTTPException(400, "Не удалось списать исследовательский пакет")
    if level == 10:
        if not consume_item(kingdom, 'бриллиант', 1, db):
            raise HTTPException(400, "Не удалось списать бриллиант")

    tech = TechResearch(kingdom_id=kingdom.id, tree=tree, level=level, variant=variant)
    db.add(tech)
    db.commit()
    return {"status": "ok"}
