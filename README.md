
## Helen Environment
Default local ports:
- Gateway: http://localhost:8081
- PostgreSQL: `localhost:5433`
- Redis: `localhost:6380`
- RabbitMQ: `localhost:5673`
- RabbitMQ Management UI: http://localhost:15673
Important container names:
- PostgreSQL: `uit-dkhp-postgres-helen`
- Redis: `uit-dkhp-redis-helen`
- RabbitMQ: `uit-dkhp-rabbitmq-helen`
- Gateway: `uit-dkhp-gateway-helen`
## Quick Start
1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
2. Start infrastructure first:
   ```bash
   docker compose up -d postgres redis rabbitmq
   ```
3. Run database migrations after PostgreSQL is healthy.
   Windows PowerShell:
   ```powershell
   docker cp database\migrations\001_users.sql uit-dkhp-postgres-helen:/tmp/001_users.sql
   docker cp database\migrations\002_courses_classes.sql uit-dkhp-postgres-helen:/tmp/002_courses_classes.sql
   docker cp database\migrations\003_enrollments.sql uit-dkhp-postgres-helen:/tmp/003_enrollments.sql
   docker cp database\seed.sql uit-dkhp-postgres-helen:/tmp/seed.sql

   docker exec -i uit-dkhp-postgres-helen psql -U uit -d uit_dkhp -f /tmp/001_users.sql
   docker exec -i uit-dkhp-postgres-helen psql -U uit -d uit_dkhp -f /tmp/002_courses_classes.sql
   docker exec -i uit-dkhp-postgres-helen psql -U uit -d uit_dkhp -f /tmp/003_enrollments.sql
   docker exec -i uit-dkhp-postgres-helen psql -U uit -d uit_dkhp -f /tmp/seed.sql
   ```

4. Start all services:
   ```bash
   docker compose up -d
   ```
5. Open the app:
   ```text
   http://localhost:8081
   ```
Seed accounts:
- Student: `23520718` / `password`
- Admin: `admin` / `password`
## Reset This Environment
If migrations show `already exists`, the Helen database has already been initialized. You can keep going with `database/seed.sql`, or reset only this copy:
```bash
docker compose down -v
docker compose up -d postgres redis rabbitmq
```
Then run the migrations again.
## Run Side By Side With The Team Copy
Typical separation:
- Helen gateway: `http://localhost:8081`
- Helen PostgreSQL: `localhost:5433`
## Rebuild
```bash
docker compose down --rmi local
docker compose up -d --build
```
## Project Structure
- `api-gateway/` - Nginx config
- `frontend/` - React SPA
- `services/auth/` - Auth service
- `services/course/` - Course service
- `services/registration/` - Registration service
- `services/notification/` - Notification service
- `database/migrations/` - SQL migrations
- `database/seed.sql` - Seed data
- `docker-compose.yml` - Full local stack
- `Dockerfile.gateway` - Frontend build and Nginx image
## Local Development Without Docker For Backend
1. Start infrastructure:
   ```bash
   docker compose up -d postgres redis rabbitmq
   ```
2. Run migrations from the Quick Start section.   
3. In each backend service folder, install dependencies and run dev mode:
   ```bash
   npm install
   npm run start:dev
   ```
4. For frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```