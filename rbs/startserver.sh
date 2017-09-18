#!/bin/bash
forever -o ./logs/access.log -e ./logs/error.log start server.js
