#!/bin/bash
cd /home/kavia/workspace/code-generation/interactive-chat-interface-10841-10851/chat_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

