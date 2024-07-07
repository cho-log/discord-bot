#!/bin/bash
pm2 delete discord-bot
pm2 start java --name discord-bot -- \
    -Duser.timezone=Asia/Seoul \
    -Dfile.encoding=UTF-8 \
    -Xms1G \
    -Xmx1G \
    -jar /home/ubuntu/discord-bot.jar
