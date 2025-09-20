#!/bin/bash

# 启动 Hugo 本地开发服务器
# shellcheck disable=SC2164
hugo server --theme=WebStack-Hugo --config config.toml  --port 64341 --buildDrafts
