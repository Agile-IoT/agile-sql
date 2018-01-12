#!/bin/bash
CONF=/etc/agile-sql

echo "checking if configuration is in folder $CONF"
if [ ! -f "$CONF/agile-db.js" ]; then
  echo "folder not there for conf"
  cp -r conf/* $CONF
fi


node index.js $CONF
