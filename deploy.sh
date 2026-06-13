#!/bin/bash
# deploy.sh — Deploy MalackathART a Google Cloud Run
# Uso: bash deploy.sh

set -e

PROJECT_ID="malackath-art"
REGION="us-central1"
SERVICE_NAME="malackath-art"
IMAGE="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo ""
echo "🎨 Deploy MalackathART → Google Cloud Run"
echo "==========================================="
echo ""

# 1. Build React frontend
echo "📦 Construyendo el frontend..."
cd frontend
npm install --legacy-peer-deps
npm run build
cd ..

# 2. Build y push imagen Docker con Cloud Build
echo ""
echo "🐳 Construyendo imagen en Google Cloud..."
gcloud builds submit \
  --tag "$IMAGE" \
  --project "$PROJECT_ID" \
  .

# 3. Deploy a Cloud Run
echo ""
echo "🚀 Deployando en Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "MONGO_URL=mongodb+srv://arnelli-admin:Maite!231203@arnelli-db.j5swamy.mongodb.net/?appName=arnelli-db" \
  --set-env-vars "DB_NAME=malackath_art" \
  --set-env-vars "JWT_SECRET=malackath-jwt-super-secret-2026" \
  --set-env-vars "ADMIN_EMAIL=admin@malackath.art" \
  --set-env-vars "ADMIN_PASSWORD=Admin123!" \
  --set-env-vars "STRIPE_API_KEY=sk_test_placeholder" \
  --project "$PROJECT_ID"

echo ""
echo "✅ Deploy completado!"
echo ""
echo "🌐 URL del sitio:"
gcloud run services describe "$SERVICE_NAME" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --format "value(status.url)"
