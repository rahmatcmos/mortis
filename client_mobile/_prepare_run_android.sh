#!/usr/bin/env bash

# #############################################################################
#
# setup the enviroment

export JAVA_HOME=/usr/lib/jvm/java-8-oracle
export PATH="$PATH:$JAVA_HOME/bin"

export ANDROID_HOME=/home/xavier/Android/Sdk
export PATH="$PATH:$ANDROID_HOME"
export PATH="$PATH:$ANDROID_HOME/tools"
export PATH="$PATH:$ANDROID_HOME/platform-tools"

export ANT_HOME="$HOME/_Main/_Setup/apache-ant-1.10.1"
export PATH="$PATH:$ANT_HOME/bin"

export MAVEN_HOME="$HOME/_Main/_Setup/apache-maven-3.3.9"
export PATH="$PATH:$MAVEN_HOME/bin"

export NPM_PACKAGES="${HOME}/.npm-packages"
export NODE_PATH="$NPM_PACKAGES/lib/node_modules:$NODE_PATH"
export PATH="$PATH:$NPM_PACKAGES/bin"

unset MANPATH
export MANPATH="$NPM_PACKAGES/share/man:$MANPATH"

export PATH="$PATH:$HOME/.rvm/bin"

# #############################################################################
#

./_prepare.sh

cd source

cordova platform rm android
cordova platform add android
ionic build android

ionic emulate android --client_mobile