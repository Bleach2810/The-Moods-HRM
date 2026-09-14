#!/bin/bash
# redeploy.sh - Tự động build và restart cả FE và BE trên server

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "   BẮT ĐẦU TỰ ĐỘNG DEPLOY (FE & BE)      "
echo "========================================="

# 1. Build & Restart Backend
echo "--> Đang biên dịch và build Backend..."
cd "$SCRIPT_DIR/backend"
dotnet publish -c Release -o ./publish

echo "--> Đang restart Backend trên PM2..."
pm2 delete themoods-be 2>/dev/null || true
killall dotnet 2>/dev/null || true
pm2 start "dotnet ./publish/TheMoods.Api.dll --urls http://127.0.0.1:5078" --name "themoods-be"

# 2. Build & Restart Frontend
echo "--> Đang build Frontend (Next.js)..."
cd "$SCRIPT_DIR"
npm run build

echo "--> Đang restart Frontend trên PM2..."
pm2 delete themoods-fe 2>/dev/null || true
PORT=8899 pm2 start npm --name "themoods-fe" -- run start

# 3. Lưu cấu hình PM2
pm2 save

echo "========================================="
echo "        DEPLOY THÀNH CÔNG!              "
echo "========================================="
