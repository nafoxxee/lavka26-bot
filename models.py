from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    telegram_id = Column(Integer, unique=True, nullable=False)
    username = Column(String(255))
    first_name = Column(String(255))
    last_name = Column(String(255))
    phone = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    ads = relationship("Ad", back_populates="user")
    favorites = relationship("Favorite", back_populates="user")
    payments = relationship("Payment", back_populates="user")

class Category(Base):
    __tablename__ = 'categories'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    emoji = Column(String(10))
    parent_id = Column(Integer, ForeignKey('categories.id'))
    order = Column(Integer, default=0)
    
    parent = relationship("Category", remote_side=[id])
    children = relationship("Category")
    ads = relationship("Ad", back_populates="category")

class Ad(Base):
    __tablename__ = 'ads'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    price = Column(Float)
    photos = Column(JSON)  # список file_id фото
    location = Column(JSON)  # {latitude, longitude}
    status = Column(String(20), default='active')  # active, moderation, archived
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Поля для продвижения
    is_pinned = Column(Boolean, default=False)
    pin_until = Column(DateTime)
    is_boosted = Column(Boolean, default=False)
    boost_until = Column(DateTime)
    
    user = relationship("User", back_populates="ads")
    category = relationship("Category", back_populates="ads")
    favorites = relationship("Favorite", back_populates="ad")

class Favorite(Base):
    __tablename__ = 'favorites'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    ad_id = Column(Integer, ForeignKey('ads.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="favorites")
    ad = relationship("Ad", back_populates="favorites")

class Chat(Base):
    __tablename__ = 'chats'
    
    id = Column(Integer, primary_key=True)
    ad_id = Column(Integer, ForeignKey('ads.id'), nullable=False)
    initiator_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    responder_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    ad = relationship("Ad")
    initiator = relationship("User", foreign_keys=[initiator_id])
    responder = relationship("User", foreign_keys=[responder_id])
    messages = relationship("Message", back_populates="chat")

class Message(Base):
    __tablename__ = 'messages'
    
    id = Column(Integer, primary_key=True)
    chat_id = Column(Integer, ForeignKey('chats.id'), nullable=False)
    sender_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    text = Column(Text)
    photo = Column(String(500))  # file_id
    created_at = Column(DateTime, default=datetime.utcnow)
    
    chat = relationship("Chat", back_populates="messages")
    sender = relationship("User")

class Payment(Base):
    __tablename__ = 'payments'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String(50))  # ad_creation, boost_day, boost_week, pin_month
    status = Column(String(20), default='pending')  # pending, completed, failed
    telegram_payment_id = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="payments")
