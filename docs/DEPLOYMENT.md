# Deployment & Operations Guide - BizFlow Ethiopia

## Target Deployment Environments
- **Hosting:** Vercel (or Dockerized container on AWS / DigitalOcean / Railway)
- **Database:** Managed PostgreSQL (Supabase, Neon, AWS RDS, or Railway PostgreSQL)
- **Object Storage:** Cloudflare R2 or AWS S3 for business logos and receipt assets

## Deployment Checklist
1. Configure Environment Variables (`DATABASE_URL`, `JWT_SECRET`, `APP_URL`).
2. Run database migrations: `npx prisma migrate deploy`.
3. Build Next.js application: `npm run build`.
4. Verify health endpoint and SSL configuration.
