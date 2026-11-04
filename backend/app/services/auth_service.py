from app.constants import EMPLOYEE, ROLES
from app.models import Employee, User
from app.repositories.employee_repository import EmployeeRepository
from app.repositories.user_repository import UserRepository
from app.schemas import LoginRequest, RegisterRequest, TokenResponse
from app.security import create_access_token, hash_password, verify_password
from app.services.errors import ConflictError, ForbiddenError, UnauthorizedError, ValidationError


class AuthService:
    def __init__(self, users: UserRepository, employees: EmployeeRepository):
        self.users = users
        self.employees = employees

    def register(self, data: RegisterRequest) -> User:
        """Self-registration is for employees only, and only for emails HR already added."""
        employee = self.employees.get_by_email(data.email)
        if employee is None:
            raise ForbiddenError("No employee record with this email. Ask HR to add you first.")
        return self._create(data.email, data.password, EMPLOYEE, employee)

    def create_user(self, email: str, password: str, role: str) -> User:
        """Used by scripts (e.g. to create managers). Links to an employee record if one exists."""
        if role not in ROLES:
            raise ValidationError(f"Unknown role: {role}")
        return self._create(email, password, role, self.employees.get_by_email(email))

    def login(self, data: LoginRequest) -> TokenResponse:
        user = self.users.get_by_email(data.email)
        # same message for unknown email and wrong password, so emails can't be probed
        if user is None or not verify_password(data.password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password")
        if not user.is_active:
            raise ForbiddenError("This account is disabled")
        token, expires_in = create_access_token(user.id, user.role)
        return TokenResponse(access_token=token, expires_in=expires_in, role=user.role)

    def profile(self, user: User) -> Employee | None:
        return self.employees.get(user.employee_id) if user.employee_id else None

    def _create(self, email: str, password: str, role: str, employee: Employee | None) -> User:
        if self.users.get_by_email(email):
            raise ConflictError("An account with this email already exists")
        user = User(
            email=email.lower(),
            hashed_password=hash_password(password),
            role=role,
            employee_id=employee.id if employee else None,
        )
        return self.users.add(user)