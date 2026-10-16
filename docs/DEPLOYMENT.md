# Deployment & Operations Guide - BizFlow Ethiopia

## Target Deployment Environments
- **Hosting:** Vercel (or Dockerized container on AWS / DigitalOcean / Railway)
- **Database:** Managed PostgreSQL (Supabase, Neon, AWS RDS, or Railway PostgreSQL)
- **Object Storage:** Cloudflare R2 or AWS S3 for business logos and receipt assets

## Deployment Checklist
1. Configure Environment Variables (`DATABASE_URL`, `JWT_SECRET`, `APP_URL`). Production startup requires an explicit `DATABASE_URL` and a unique `JWT_SECRET` of at least 32 characters; the development fallbacks are rejected.
2. Set `JWT_EXPIRES_IN` to a duration such as `15m`, `7d`, or `1y` if the default seven-day token lifetime is not appropriate.
3. Run database migrations: `npx prisma migrate deploy`.
4. Build Next.js application: `npm run build`.
5. Verify health endpoint and SSL configuration.
