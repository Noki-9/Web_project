from fastapi import FastAPI, Request, Depends, HTTPException, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware
from database import engine, session_local, NotBaseError
from Forms import Base, UserAccount, Kingdom, Request_db, Resurses, People, Economy

# Для запуска сервера введите в консоль "uvicorn main:app --host <Ip компа> --port <Какой хотите> --reload"
# --reload нужен для отладки

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount('/scripts', StaticFiles(directory="scripts"), name="scripts")
app.add_middleware(SessionMiddleware, secret_key="8794561324")
templates = Jinja2Templates(directory="templates")

# Создание таблиц
Base.metadata.create_all(engine)

# Константы начальных значений
RESURSES = Resurses(wheat=30, gold=1, iron=0, factor=20, tools=0, weapons=0)
PEOPLE = People(people_count=17, happy=100, study=1, level=1)
ECONOMY = Economy(profit=10, kazna=0, eco_plus=0, eco_minus=7)


def get_db():
    db = session_local()
    try:
        yield db
    except Exception as e:
        raise NotBaseError(f"Ошибка базы данных: {e}")
    finally:
        db.close()


@app.get("/")
async def home(request: Request, error: str = None, login: str = None):
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "error": error, "login": login}
    )


@app.get("/reg")
async def show_registration(request: Request, error: str = None, login: str = None):
    return templates.TemplateResponse(
        "reg.html",
        {"request": request, "error": error, "login": login}
    )


@app.post("/reg")
async def show_registration(request: Request, error: str = None, login: str = None):
    return templates.TemplateResponse(
        "reg.html",
        {"request": request, "error": error, "login": login}
    )


@app.get("/file_maneger", response_class=HTMLResponse)
async def file_maneger(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id:
        return RedirectResponse(url="/", status_code=303)

    user = db.query(UserAccount).filter(UserAccount.id == user_id).first()
    if not user:
        request.session.clear()
        return RedirectResponse(url="/", status_code=303)

    kingdoms = user.kingdoms
    return templates.TemplateResponse(
        "file_maneger.html",
        {"request": request, "kingdoms": kingdoms}
    )


@app.post("/login")
async def login(
        request: Request,
        Login: str = Form(None),
        password: str = Form(None),
        db: Session = Depends(get_db)
):
    if Login is None or password is None:
        return RedirectResponse(
            url="/?error=Заполните все поля",
            status_code=303
        )

    user = db.query(UserAccount).filter(UserAccount.username == Login).first()
    if not user or user.password != password:
        return RedirectResponse(
            url=f"/?error=Неверное имя пользователя или пароль&login={Login}",
            status_code=303
        )

    request.session['user_id'] = user.id
    return RedirectResponse(url="/file_maneger", status_code=303)


@app.post("/file_maneger/reg")
async def file_reg(
        request: Request,
        Login: str = Form(None),
        password: str = Form(None),
        password_correct: str = Form(None),
        db: Session = Depends(get_db)
):
    # Проверка заполнения всех полей
    if Login is None or password is None or password_correct is None:
        return RedirectResponse(
            url="/reg?error=Заполните все поля",
            status_code=303
        )

    # Проверка совпадения паролей
    if password != password_correct:
        return RedirectResponse(
            url=f"/reg?error=Пароли не совпадают&login={Login}",
            status_code=303
        )

    # Проверка существования пользователя
    existing = db.query(UserAccount).filter(UserAccount.username == Login).first()
    if existing:
        return RedirectResponse(
            url=f"/reg?error=Пользователь с таким именем уже существует&login={Login}",
            status_code=303
        )

    # Создание нового пользователя (пароль без хеширования, как требуется)
    new_user = UserAccount(username=Login, password=password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Автоматический вход
    request.session['user_id'] = new_user.id
    return RedirectResponse(url="/file_maneger", status_code=303)


@app.get("/kingdom", response_class=HTMLResponse)
async def kingdom_page(
        request: Request,
        kingdom_id: int = None,
        db: Session = Depends(get_db)
):
    user_id = request.session.get('user_id')
    if not user_id:
        return RedirectResponse(url="/", status_code=303)

    kingdom_data = None
    if kingdom_id:
        kingdom = db.query(Kingdom).filter(Kingdom.id == kingdom_id, Kingdom.user_id == user_id).first()
        if not kingdom:
            raise HTTPException(status_code=404, detail="Королевство не найдено")

        # Формируем словарь для передачи в шаблон
        kingdom_data = {
            'id': kingdom.id,
            'name': kingdom.name,
            'wheat': kingdom.wheat,
            'gold': kingdom.gold,
            'iron': kingdom.iron,
            'factor': kingdom.factor,
            'tools': kingdom.tools,
            'weapons': kingdom.weapons,
            'people_count': kingdom.people_count,
            'happy': kingdom.happy,
            'study': kingdom.study,
            'level': kingdom.level,
            'profit': kingdom.profit,
            'kazna': kingdom.kazna,
            'eco_plus': kingdom.eco_plus,
            'eco_minus': kingdom.eco_minus,
            'war': kingdom.war,
            'arrow': kingdom.arrow,
            'mag': kingdom.mag,
            'gun': kingdom.gun,
            'war_ship': kingdom.war_ship,
            'war_ride': kingdom.war_ride,
            'guard_tower': kingdom.guard_tower,
            'ship': kingdom.ship,
            'ride': kingdom.ride,
            'logic': kingdom.logic,
            'warehouse': kingdom.warehouse,
            'requests': [{'kingdomName': r.kingdomName, 'object': r.object, 'count': r.count} for r in kingdom.requests]
        }

    return templates.TemplateResponse(
        "kingdom.html",
        {"request": request, "kingdom": kingdom_data}
    )


@app.post("/kingdom/save")
async def save_kingdom(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id:
        raise HTTPException(status_code=401, detail="Не авторизован")

    data = await request.json()
    kingdom_id = data.get('id')

    required_fields = [
        'name', 'wheat', 'gold', 'iron', 'factor', 'tools', 'weapons',
        'people_count', 'happy', 'study', 'level', 'profit', 'kazna',
        'eco_plus', 'eco_minus', 'war', 'arrow', 'mag', 'gun',
        'war_ship', 'war_ride', 'guard_tower', 'ship', 'ride',
        'logic', 'warehouse'
    ]
    for field in required_fields:
        if field not in data:
            raise HTTPException(status_code=400, detail=f"Отсутствует поле {field}")

    if kingdom_id:
        # Обновление существующего королевства
        kingdom = db.query(Kingdom).filter(Kingdom.id == kingdom_id, Kingdom.user_id == user_id).first()
        if not kingdom:
            raise HTTPException(status_code=404, detail="Королевство не найдено")
        for field in required_fields:
            setattr(kingdom, field, data[field])
        # Обновляем запросы: удаляем старые и добавляем новые
        db.query(Request_db).filter(Request_db.kingdom_id == kingdom_id).delete()
        for req in data.get('requests', []):
            new_req = Request_db(
                kingdom_id=kingdom_id,
                kingdomName=req['kingdomName'],
                object=req['object'],
                count=req['count']
            )
            db.add(new_req)
    else:
        # Создание нового королевства
        new_kingdom = Kingdom(
            user_id=user_id,
            name=data['name'],
            wheat=data['wheat'],
            gold=data['gold'],
            iron=data['iron'],
            factor=data['factor'],
            tools=data['tools'],
            weapons=data['weapons'],
            people_count=data['people_count'],
            happy=data['happy'],
            study=data['study'],
            level=data['level'],
            profit=data['profit'],
            kazna=data['kazna'],
            eco_plus=data['eco_plus'],
            eco_minus=data['eco_minus'],
            war=data['war'],
            arrow=data['arrow'],
            mag=data['mag'],
            gun=data['gun'],
            war_ship=data['war_ship'],
            war_ride=data['war_ride'],
            guard_tower=data['guard_tower'],
            ship=data['ship'],
            ride=data['ride'],
            logic=data['logic'],
            warehouse=data['warehouse']
        )
        db.add(new_kingdom)
        db.flush()
        for req in data.get('requests', []):
            new_req = Request_db(
                kingdom_id=new_kingdom.id,
                kingdomName=req['kingdomName'],
                object=req['object'],
                count=req['count']
            )
            db.add(new_req)
        kingdom_id = new_kingdom.id

    db.commit()
    return {"status": "ok", "id": kingdom_id}


@app.delete("/kingdom/{kingdom_id}")
async def delete_kingdom(kingdom_id: int, request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id:
        raise HTTPException(status_code=401, detail="Не авторизован")

    kingdom = db.query(Kingdom).filter(Kingdom.id == kingdom_id, Kingdom.user_id == user_id).first()
    if not kingdom:
        raise HTTPException(status_code=404, detail="Королевство не найдено")

    db.delete(kingdom)
    db.commit()
    return {"status": "ok"}
