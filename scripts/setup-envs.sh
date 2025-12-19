#!/bin/bash
echo "🛠 Generating Knwdle environment files..."

############################################
# API — LOCAL
############################################
cat > apps/api/.env.local <<EOF
NODE_ENV=development
API_PORT=4000
API_URL=http://localhost:4000

DATABASE_URL=postgresql://knwdle:knwdle_pass@localhost:5433/knwdle_db?schema=public
SHADOW_DATABASE_URL=postgresql://knwdle:knwdle_pass@localhost:5433/knwdle_db_shadow?schema=public

JWT_ACCESS_SECRET=dev-access-secret
JWT_REFRESH_SECRET=dev-refresh-secret
ACCESS_EXPIRES_MIN=30
REFRESH_EXPIRES_DAYS=30

CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
AUTH_ORIGIN=http://localhost:3000

SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=test
SMTP_PASS=test
MAIL_FROM="Knwdle Dev <no-reply@local>"

AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
AWS_REGION=ap-south-1
S3_BUCKET=knwdle-dev
S3_PUBLIC_BASE_URL=http://localhost:9000
EOF


############################################
# API — PROD TEMPLATE (SAFE!)
############################################
cat > apps/api/.env.prod <<EOF
# ===== Knwdle API PROD TEMPLATE =====
# ⚠️ Add your real values manually — DO NOT COMMIT REAL SECRETS ⚠️

NODE_ENV=production
API_PORT=4000
API_URL=https://api.yourdomain.com

DATABASE_URL=
SHADOW_DATABASE_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ACCESS_EXPIRES_MIN=15
REFRESH_EXPIRES_DAYS=30

CORS_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
AUTH_ORIGIN=https://yourdomain.com

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM="Knwdle <no-reply@yourdomain.com>"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
S3_BUCKET=
S3_PUBLIC_BASE_URL=
EOF



############################################
# WEB — LOCAL
############################################
cat > apps/web/.env.local <<EOF
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_ADMIN_BASE_URL=http://localhost:3002
EOF

############################################
# WEB — PROD TEMPLATE
############################################
cat > apps/web/.env.prod <<EOF
# ===== Knwdle WEB PROD TEMPLATE =====
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_ADMIN_BASE_URL=https://admin.yourdomain.com
EOF



############################################
# WEB ADMIN — LOCAL
############################################
cat > apps/web-admin/.env.local <<EOF
NEXT_PUBLIC_API_URL=http://localhost:4000
EOF

############################################
# WEB ADMIN — PROD TEMPLATE
############################################
cat > apps/web-admin/.env.prod <<EOF
# ===== Knwdle ADMIN PROD TEMPLATE =====
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
EOF



############################################
# STATE — LOCAL
############################################
cat > packages/state/.env.local <<EOF
NEXT_PUBLIC_API_URL=http://localhost:4000
EOF

############################################
# STATE — PROD TEMPLATE
############################################
cat > packages/state/.env.prod <<EOF
# ===== Knwdle STATE PROD TEMPLATE =====
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
EOF


echo "✅ All .env.local and .env.prod template files generated!"
echo "⚠️ Remember: NEVER commit real production secrets!"
