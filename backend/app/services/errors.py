class DomainError(Exception):
    status_code = 400
class NotFoundError(DomainError):
    status_code = 404

class ConflictError(DomainError):
    status_code = 409
class UnauthorizedError(DomainError):
    status_code = 401


class ForbiddenError(DomainError):
    status_code = 403


class ValidationError(DomainError):
    status_code = 422