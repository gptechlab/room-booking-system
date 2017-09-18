#!/bin/bash
forever stop ./server.js
forever -o ./logs/access.log -e ./logs/error.log start server.js
