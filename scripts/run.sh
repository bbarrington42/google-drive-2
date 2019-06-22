#!/usr/bin/env bash

# This is an example of a script that should be invoked via cron
# Example crontab entry that invokes the executable every minute:
# * * * * * /home/bill/bin/run.sh >> /home/bill/bin/drive.log

# An executable can be created using 'pkg':
# Use 'pkg' to build executable, i.e.: pkg ./package.json --target host

INSTALL_DIR=/home/bill/bin

NODE_ENV=production ${INSTALL_DIR}/google-drive-2

