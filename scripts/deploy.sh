#!/bin/bash
# CodeDeploy AfterInstall hook.
# DEPLOYMENT_GROUP_NAME suffix(`-dev`)로 dev/prod 분기.
# 추후 EC2 분리 시 이 스크립트 변경 없이 deployment-group의 EC2 tag만 교체하면 된다.
#
# !! 운영 컨벤션 !!
#   - dev deployment group 이름은 반드시 `-dev`로 끝나야 한다 (예: discord-bot-dev).
#   - prod deployment group 이름은 절대 `-dev`로 끝나면 안 된다.
#     (예: `discord-bot-production-dev` 같은 이름은 금지 — case 패턴이 dev로 잘못 매칭하여 prod 봇이 dev 디렉토리에 배포된다.)
set -euo pipefail

# CodeDeploy가 hook 실행 시 자동 주입한다. 미정의 시 fail-closed로 즉시 중단 —
# fail-open(prod 폴백)은 변수 주입 실패나 로컬 수동 실행 시 prod 디렉토리/PM2 프로세스를
# 의도치 않게 조작할 위험이 있다.
if [ -z "${DEPLOYMENT_GROUP_NAME:-}" ]; then
    echo "Error: DEPLOYMENT_GROUP_NAME is not set. Deployment aborted." >&2
    exit 1
fi

case "${DEPLOYMENT_GROUP_NAME}" in
    *-dev)
        PM2_NAME=discord-bot-dev
        DEPLOY_DIR=/home/ubuntu/discord-bot-dev
        ;;
    *)
        PM2_NAME=discord-bot
        DEPLOY_DIR=/home/ubuntu/discord-bot
        ;;
esac

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
pm2 delete "${PM2_NAME}" 2>/dev/null || true

pm2 start "${ENTRY}" \
    --name "${PM2_NAME}" \
    --node-args="--env-file=${ENV_FILE}" \
    --update-env

pm2 save
