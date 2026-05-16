from fastapi import FastAPI, Request, Depends, HTTPException, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware
from database import engine, session_local
from Forms import Base, UserAccount, Kingdom, Request_db
from datetime import datetime
import bcrypt

# Для запуска сервера введите в консоль "uvicorn main:app --host <Ip компа> --port <Какой хотите> --reload"
# --reload нужен для отладки

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
                'factor': kingdom.factor, 'tools': kingdom.tools, 'weapons': kingdom.weapons,
                'people_count': kingdom.people_count, 'happy': kingdom.happy, 'study': kingdom.study,
                'level': kingdom.level, 'profit': kingdom.profit, 'kazna': kingdom.kazna,
                'eco_plus': kingdom.eco_plus, 'eco_minus': kingdom.eco_minus,
                'war': kingdom.war, 'arrow': kingdom.arrow, 'mag': kingdom.mag, 'gun': kingdom.gun,
                'war_ship': kingdom.war_ship, 'war_ride': kingdom.war_ride, 'guard_tower': kingdom.guard_tower,
                'ship': kingdom.ship, 'ride': kingdom.ride, 'logic': kingdom.logic, 'warehouse': kingdom.warehouse,
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
    required = ['name', 'wheat', 'gold', 'iron', 'factor', 'tools', 'weapons',
                'people_count', 'happy', 'study', 'level', 'profit', 'kazna',
                'eco_plus', 'eco_minus', 'war', 'arrow', 'mag', 'gun',
                'war_ship', 'war_ride', 'guard_tower', 'ship', 'ride',
                'logic', 'warehouse']
    for f in required:
        if f not in data:
            raise HTTPException(400, f"Отсутствует поле {f}")

    avatar = data.get('avatar')
    print(f"DEBUG: avatar received - type {type(avatar)}, length {len(avatar) if avatar else 0}")

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
            Request_db(kingdom_id=kingdom_id, kingdomName=req['kingdomName'], object=req['object'], count=req['count']))
    db.commit()
    print(
        f"DEBUG: After commit, avatar in DB: {kingdom.avatar is not None} length {len(kingdom.avatar) if kingdom.avatar else 0}")
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
