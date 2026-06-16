from .database import engine

with engine.connect() as conn:
    print("Connected successfully")