#!/usr/bin/env bash

curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install nodejs -y
node --version

sudo npm install --global pm2
pm2 --version
