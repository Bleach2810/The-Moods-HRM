#!/bin/bash
# redeploy.sh - Tự động build và restart cả FE và BE trên server

echo "========================================="
echo "   BẮT ĐẦU TỰ ĐỘNG DEPLOY (FE & BE)      "
echo "========================================="

# 1. Build & Restart Backend
echo "--> Đang biên dịch và build Backend..."
cd ~/www/themoods.tieenz.site/backend
dotnet publish -c Release -o ./publish

echo "--> Đang restart Backend trên PM2..."
pm2 delete themoods-be 2>/dev/null || true
killall dotnet 2>/dev/null || true
pm2 start dotnet --name "themoods-be" -- ./publish/TheMoods.Api.dll --urls "http://127.0.0.1:5078"

# 2. Build & Restart Frontend
echo "--> Đang build Frontend (Next.js)..."
cd ~/www/themoods.tieenz.site
npm run build

echo "--> Đang restart Frontend trên PM2..."
pm2 delete themoods-fe 2>/dev/null || true
PORT=8899 pm2 start npm --name "themoods-fe" -- run start

# 3. Lưu cấu hình PM2
pm2 save

echo "========================================="
echo "        DEPLOY THÀNH CÔNG!              "
echo "========================================="
