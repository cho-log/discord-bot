#!/usr/bin/env bash

sudo apt-get update -y
sudo apt-get install -y ruby
cd /home/ubuntu
wget https://aws-codedeploy-ap-northeast-2.s3.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto
