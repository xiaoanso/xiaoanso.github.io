#!/bin/bash

# 启动 Hugo 本地开发服务器
# shellcheck disable=SC2164

# 杀掉可能正在运行的旧进程
pkill -f "hugo server.*--port 64341" >/dev/null 2>&1

# 等待旧进程完全终止
sleep 2

# 删除编译目录
rm -rf public/*

# 启动新服务
hugo server --theme=WebStack-Hugo --config config.toml --port 64341 --buildDrafts