FROM postgres:16-alpine

WORKDIR /migrations

COPY migrations ./migrations
COPY seed.sql ./seed.sql
COPY run-migrations.sh ./run-migrations.sh

RUN chmod +x ./run-migrations.sh

ENTRYPOINT ["./run-migrations.sh"]
