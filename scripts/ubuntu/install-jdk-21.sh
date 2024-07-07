#!/usr/bin/env bash

sudo mkdir /usr/lib/jvm
wget https://download.java.net/java/GA/jdk21.0.2/f2283984656d49d69e91c558476027ac/13/GPL/openjdk-21.0.2_linux-aarch64_bin.tar.gz -O /tmp/openjdk-21.0.2_linux-aarch64_bin.tar.gz
sudo tar xfvz /tmp/openjdk-21.0.2_linux-aarch64_bin.tar.gz --directory /usr/lib/jvm
rm -f /tmp/openjdk-21.0.2_linux-aarch64_bin.tar.gz
sudo update-alternatives --install /usr/bin/java java /usr/lib/jvm/jdk-21.0.2/bin/java 100
sudo update-alternatives --set java /usr/lib/jvm/jdk-21.0.2/bin/java
export JAVA_HOME=/usr/lib/jvm/jdk-21.0.2
export PATH=$PATH:/usr/lib/jvm/jdk-21.0.2/bin
java -version
