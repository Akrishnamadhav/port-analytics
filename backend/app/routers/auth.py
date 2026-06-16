from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
# 1. Import the Form dependency required by Swagger
from fastapi.security import OAuth2PasswordRequestForm

from sqlalchemy.orm import Session

from ..models.user import User
from ..schemas.user import (
    UserCreate,
    UserLogin
)

from ..dependencies.db import get_db

from ..core.security import (
    hash_password,
    verify_password,
    create_access_token
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(
            User.username == user.username
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username exists"
        )

    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered"
    }


@router.post("/login")
def login(
    # 2. Swap 'credentials: UserLogin' for 'form_data: OAuth2PasswordRequestForm = Depends()'
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # 3. Read username and password from form_data instead of credentials
    user = (
        db.query(User)
        .filter(
            User.username == form_data.username
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    if not verify_password(
        form_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    token = create_access_token(
        {
            "sub": user.username,
            "role": user.role
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


from ..dependencies.auth import (
    get_current_user
)

@router.get("/me")
def me(
    current_user=Depends(
        get_current_user
    )
):
    # Map the database object attributes to your expected output keys
    return {
        "sub": current_user.username,
        "role": current_user.role
    }