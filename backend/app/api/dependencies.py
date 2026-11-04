import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.constants import MANAGER
from app.database import get_db
from app.models import User
from app.repositories.employee_repository import EmployeeRepository
from app.repositories.user_repository import UserRepository
from app.security import decode_access_token
from app.services.auth_service import AuthService
from app.services.employee_service import EmployeeService
from app.services.errors import ForbiddenError, UnauthorizedError
from app.services.insights_service import InsightsService

bearer = HTTPBearer(auto_error=False, description="Paste the access_token from /api/auth/login")


def get_repo(db: Session = Depends(get_db)) -> EmployeeRepository:
    return EmployeeRepository(db)


def get_employee_service(repo: EmployeeRepository = Depends(get_repo)) -> EmployeeService:
    return EmployeeService(repo)


def get_insights_service(repo: EmployeeRepository = Depends(get_repo)) -> InsightsService:
    return InsightsService(repo)


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(UserRepository(db), EmployeeRepository(db))


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise UnauthorizedError("Not authenticated")
    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.PyJWTError:
        raise UnauthorizedError("Invalid or expired token") from None
    # load from the DB on every request, so a deleted or disabled user loses access immediately
    user = UserRepository(db).get(int(payload["sub"]))
    if user is None or not user.is_active:
        raise UnauthorizedError("Invalid or expired token")
    return user


def require_manager(user: User = Depends(get_current_user)) -> User:
    if user.role != MANAGER:
        raise ForbiddenError("Managers only")
    return user