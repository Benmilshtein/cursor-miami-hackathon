# Dokploy deployment

Use `docker-compose.dokploy.yml` for Dokploy. The local `docker-compose.yml` file is for development/testing and loads `.env`, which is not appropriate for production.

## Why this exists

Dokploy database hostnames are often **internal** (e.g. a service name on the shared Dokploy Docker network) and only resolve from containers attached to that network. The Dokploy compose file connects the app service to `dokploy-network` and leaves runtime secrets/config in Dokploy's Environment settings.

## Dokploy setup

1. Configure the app to deploy from `docker-compose.dokploy.yml`.
2. Set the app environment variables in Dokploy instead of relying on `.env`.
3. Use the database connection string from your Dokploy database service (copy from the Dokploy UI or your internal docs).

Required environment variables (see `.env.example` for the full list):

- `DATABASE_URL` / `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL`
- `SUPER_ADMIN_EMAILS`

Example database URL (placeholders: use your real host and credentials):

```env
DATABASE_URL=postgresql://your_user:your_password@your-dokploy-db-hostname:5432/your_database
```

If Dokploy still reports `EAI_AGAIN` after switching to this file, verify the deployed app container is attached to `dokploy-network`. If Dokploy is using isolated deployments for this service, either disable isolation for the app or ensure the app is also connected to `dokploy-network`.
