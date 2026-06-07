from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, DateTime, Text
from sqlalchemy.orm import relationship
from database import Base


# ---------- SQLAlchemy модели ----------
class UserAccount(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # хранит bcrypt хеш
    last_login = Column(DateTime, nullable=True)
    kingdoms = relationship("Kingdom", back_populates="user", cascade="all, delete-orphan")


class Kingdom(Base):
    __tablename__ = 'kingdoms'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    avatar = Column(Text, nullable=True)  # base64 изображение

    # Ресурсы
    wheat = Column(Integer)
    gold = Column(Integer)
    iron = Column(Integer)
    factor = Column(Integer)
    # Население
    people_count = Column(Integer)
    happy = Column(Integer)
    study = Column(Integer)
    level = Column(Integer)
    # Экономика
    profit = Column(Integer)
    kazna = Column(Integer)
    eco_plus = Column(Integer)
    eco_minus = Column(Integer)
    # Юниты
    war = Column(Integer)
    arrow = Column(Integer)
    mag = Column(Integer)
    gun = Column(Integer)
    war_ship = Column(Integer)
    war_ride = Column(Integer)
    guard_tower = Column(Integer)
    ship = Column(Integer)
    ride = Column(Integer)
    logic = Column(Integer)
    warehouse = Column(Integer)
    warehouse_level = Column(String, default="0,0,0")  # Формат: "L1,L2,L3"

    user = relationship("UserAccount", back_populates="kingdoms")
    requests = relationship("Request_db", back_populates="kingdom", cascade="all, delete-orphan")
    warehouse_items = relationship("WarehouseItem", back_populates="kingdom", cascade="all, delete-orphan")
    tech_researches = relationship("TechResearch", back_populates="kingdom", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint('user_id', 'name', name='_user_kingdom_uc'),)


class Request_db(Base):
    __tablename__ = 'requests'
    id = Column(Integer, primary_key=True)
    kingdom_id = Column(Integer, ForeignKey('kingdoms.id'))
    kingdomName = Column(String, nullable=False)
    object = Column(String, nullable=False)
    count = Column(Integer, nullable=False)

    kingdom = relationship("Kingdom", back_populates="requests")


class WarehouseItem(Base):
    __tablename__ = 'warehouse_items'

    id = Column(Integer, primary_key=True, index=True)
    kingdom_id = Column(Integer, ForeignKey('kingdoms.id'), nullable=False)
    name = Column(String(100), nullable=False)
    count = Column(Integer, nullable=False, default=0)
    storage_type = Column(String(10), nullable=False)  # 'single' or 'stack'

    # Связь с королевством
    kingdom = relationship("Kingdom", back_populates="warehouse_items")


class TechResearch(Base):
    __tablename__ = 'tech_researches'

    id = Column(Integer, primary_key=True, index=True)
    kingdom_id = Column(Integer, ForeignKey('kingdoms.id'), nullable=False)
    tree = Column(String(20), nullable=False)  # 'trade', 'military', 'management', 'special'
    level = Column(Integer, nullable=False)
    variant = Column(String(50), nullable=True)  # для уровней с вариантами

    kingdom = relationship("Kingdom", back_populates="tech_researches")
