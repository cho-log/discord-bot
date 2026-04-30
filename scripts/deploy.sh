#!/bin/bash
# CodeDeploy AfterInstall hook.
# /home/ubuntu/discord-bot에 풀린 deploy 패키지 기반으로 봇을 재기동한다.
set -euo pipefail

DEPLOY_DIR=/home/ubuntu/discord-bot
ENV_FILE="${DEPLOY_DIR}/.env"
ENTRY="${DEPLOY_DIR}/dist/index.js"

cd "${DEPLOY_DIR}"

# .env 무결성 검증 (없거나 비어있으면 실패시켜 crash loop 차단)
if [ ! -s "${ENV_FILE}" ]; then
    echo "Error: ${ENV_FILE} is missing or empty" >&2
    exit 1
fi
chmod 600 "${ENV_FILE}"

if [ ! -f "${ENTRY}" ]; then
    echo "Error: ${ENTRY} not found" >&2
    exit 1
fi

# 기존 프로세스 정리 (없을 수도 있음)
pm2 delete discord-bot 2>/dev/null || true

pm2 start "${ENTRY}" \
    --name discord-bot \
    --node-args="--env-file=${ENV_FILE}" \
    --update-env

pm2 save
