# Database
This folder contains PostgreSQL migrations and seed data.
Run files in this order:
```text
001_users.sql
002_courses_classes.sql
003_enrollments.sql
seed.sql
```
## Local Docker
Check PostgreSQL container name:
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
## Azure PostgreSQL
If `psql` is not installed locally, use a temporary Kubernetes pod:
```powershell
kubectl run pg-client --image=postgres:16 --restart=Never -- sleep 3600
kubectl cp .\database pg-client:/tmp/database
kubectl exec -it pg-client -- bash
```
Inside the pod:
```bash
export PGPASSWORD='<azure-postgres-password>'
psql "host=uit-dkhp-pg-server.postgres.database.azure.com port=5432 dbname=uit_dkhp user=pgadmin sslmode=require" -f /tmp/database/migrations/001_users.sql
psql "host=uit-dkhp-pg-server.postgres.database.azure.com port=5432 dbname=uit_dkhp user=pgadmin sslmode=require" -f /tmp/database/migrations/002_courses_classes.sql
psql "host=uit-dkhp-pg-server.postgres.database.azure.com port=5432 dbname=uit_dkhp user=pgadmin sslmode=require" -f /tmp/database/migrations/003_enrollments.sql
psql "host=uit-dkhp-pg-server.postgres.database.azure.com port=5432 dbname=uit_dkhp user=pgadmin sslmode=require" -f /tmp/database/seed.sql
```
Check tables:
```bash
psql "host=uit-dkhp-pg-server.postgres.database.azure.com port=5432 dbname=uit_dkhp user=pgadmin sslmode=require" -c "\dt"
```
Clean up:
```bash
exit
```
```powershell
kubectl delete pod pg-client
```
## Notes
- Terraform creates the Azure PostgreSQL server, but it does not create application tables.
- Migrations create tables such as `users`, `courses`, `classes`, and `enrollments`.
- Seed data creates demo users.
- Replace `uit-dkhp-postgres-helen` with your actual local PostgreSQL container name.
- Do not commit real database passwords.
