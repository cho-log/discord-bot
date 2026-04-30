#!/usr/bin/env bash
# EC2 초기 셋업 스크립트. CodeDeploy lifecycle hook이 아니라 운영자가 직접 실행한다.
#
# Node 20 → 22 업그레이드: 마이그레이션 #3에서 변경됨. PR 머지 후 EC2에서 재실행 필수.
#
# NodeSource 공식 설치 방식(curl | bash):
# - https://github.com/nodesource/distributions 권장 절차
# - HTTPS 전송이고 cho-log 운영자가 EC2 셸에서 직접 실행한다는 전제로 사용
# - 더 엄격한 보안이 필요하면 setup_22.x를 wget으로 받아 sha256 검증 후 실행하는 방식으로 교체 가능
set -euo pipefail

curl -sL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version

sudo npm install --global pm2
pm2 --version
