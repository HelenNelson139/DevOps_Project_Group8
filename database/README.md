# Database

This folder contains PostgreSQL schema migrations and demo seed data.

Run order:

```text
001_users.sql
002_courses_classes.sql
003_enrollments.sql
seed.sql
```

## Files
- `migrations/001_users.sql`: creates the `users` table and `user_role` enum.
- `migrations/002_courses_classes.sql`: creates course and class tables.
- `migrations/003_enrollments.sql`: creates student enrollment records.
- `seed.sql`: inserts or updates demo users.
- `Dockerfile`: builds the migration image used by Kubernetes.
- `run-migrations.sh`: runs migrations and seed inside the migration container.
## Important Notes
- Migrations define database structure.
- `seed.sql` is for demo/test data, not for all production users.
- `seed.sql` uses `ON CONFLICT (student_id) DO UPDATE`, so it updates existing demo users but does not delete extra users in Azure.
- Users inserted manually in Azure PostgreSQL are not tracked by Git.
- Put users in `seed.sql` only when they must exist after every deploy or database recreation.
- Do not commit real database passwords or connection strings.

## Kubernetes Migration Job
The project runs database migrations through:
```text
k8s/jobs/db-migration-job.yaml
```
The job reads `DATABASE_URL` from:
```text
uit-dkhp-secret
```
The job has a 5-minute timeout through `activeDeadlineSeconds: 300` so Argo CD does not wait indefinitely if migration gets stuck.

Check the job:
```powershell
kubectl get job db-migration -n default
kubectl describe job db-migration -n default
kubectl logs job/db-migration -n default
```
## Check Azure Database Users

Create the pod:
```powershell
kubectl run pg-client --image=postgres:16 --restart=Never -- sleep 3600
kubectl get pod pg-client
```
Get the database URL from the Kubernetes secret:
```powershell
$encoded = kubectl get secret uit-dkhp-secret -n default -o jsonpath="{.data.DATABASE_URL}"
$DATABASE_URL = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($encoded))
```
Open `psql` from the client pod:
```powershell
kubectl exec -it pg-client -- psql "$DATABASE_URL"
```
If SSL is required:
```powershell
kubectl exec -it pg-client -- psql "$DATABASE_URL?sslmode=require"
```
List users:
```sql
SELECT id, student_id, full_name, faculty, batch, role, email, created_at
FROM users
ORDER BY created_at DESC;
```
Exit `psql`:
```sql
\q
```
Delete the client pod:

```powershell
kubectl delete pod pg-client
```
## Add Or Update Users In Azure
Generate a bcrypt password hash from the auth service:

```powershell
cd services/auth
node -e "require('bcrypt').hash('password',10).then(console.log)"
```
Update a user directly in Azure:

```sql
UPDATE users
SET full_name = 'Lam Chi Dinh',
    updated_at = NOW()
WHERE student_id = '23520291';
```
Insert a temporary test user directly in Azure:

```sql
INSERT INTO users (
  id,
  student_id,
  password_hash,
  full_name,
  faculty,
  batch,
  role,
  email
)
VALUES (
  gen_random_uuid(),
  '23520001',
  'PASTE_BCRYPT_HASH_HERE',
  'Nguyen Van A',
  'Mang may tinh truyen thong du lieu',
  '2023',
  'student',
  '23520001@gm.uit.edu.vn'
);
```
Use direct Azure inserts only for temporary test data.
For stable demo users, add them to `database/seed.sql`, then commit and push.

## Run Locally With Docker
Check the local PostgreSQL container name:
```powershell
docker ps
```
Copy SQL files into the container:
```powershell
docker cp database\migrations\001_users.sql uit-dkhp-postgres-helen:/tmp/001_users.sql
docker cp database\migrations\002_courses_classes.sql uit-dkhp-postgres-helen:/tmp/002_courses_classes.sql
docker cp database\migrations\003_enrollments.sql uit-dkhp-postgres-helen:/tmp/003_enrollments.sql
docker cp database\seed.sql uit-dkhp-postgres-helen:/tmp/seed.sql
```
Run migrations and seed:
```powershell
docker exec -i uit-dkhp-postgres-helen psql -U uit -d uit_dkhp -f /tmp/001_users.sql
docker exec -i uit-dkhp-postgres-helen psql -U uit -d uit_dkhp -f /tmp/002_courses_classes.sql
docker exec -i uit-dkhp-postgres-helen psql -U uit -d uit_dkhp -f /tmp/003_enrollments.sql
docker exec -i uit-dkhp-postgres-helen psql -U uit -d uit_dkhp -f /tmp/seed.sql
```
Check tables:
```powershell
docker exec -i uit-dkhp-postgres-helen psql -U uit -d uit_dkhp -c "\dt"
```
