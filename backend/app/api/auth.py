from fastapi import APIRouter, Depends, status

from app.api.dependencies import get_auth_service, get_current_user
from app.models import User
from app.schemas import LoginRequest, MeResponse, RegisterRequest, TokenResponse, UserOut
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, service: AuthService = Depends(get_auth_service)):
    return service.register(data)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, service: AuthService = Depends(get_auth_service)):
    return service.login(data)


@router.get("/me", response_model=MeResponse)
def me(user: User = Depends(get_current_user), service: AuthService = Depends(get_auth_service)):
    """Any logged-in user: their account and their own employee profile."""
    return MeResponse(user=user, profile=service.profile(user))