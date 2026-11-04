<img width="1390" height="552" alt="image" src="https://github.com/user-attachments/assets/5a462891-3b53-4afb-91b1-c39b160fa040" />
How it works:
1. An employee registers with the work email HR already has on record; the account is linked to that employee record.
2. Login checks the bcrypt password hash and returns a JWT that expires after 60 minutes.
3. The React app stores the token and sends it as Authorization: Bearer <token> on every request.
4. get_current_user verifies the token and loads the user from the database on every request, so a deleted or disabled account loses access immediately.
5. require_manager guards the whole employees and insights routers; a missing or bad token gives 401, the wrong role gives 403.
