#!/bin/bash
set -e

cd /home/ubuntu/discord-bot

# 기존 프로세스가 없을 수도 있으므로 삭제 실패는 무시
pm2 delete discord-bot 2>/dev/null || true

pm2 start dist/index.js \
  --name discord-bot \
  --node-args="--env-file=/home/ubuntu/discord-bot/.env" \
  --update-env

pm2 save
