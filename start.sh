#!/bin/bash
CONF=/etc/agile-sql

echo "checking if configuration is in folder $CONF"
if [ ! -f "$CONF/agile-db.js" ]; then
  echo "folder not there for conf"
  cp -r conf/* $CONF
fi

echo "here comes the current config"
cat "$CONF/agile-db.js"
echo "end of the current config"
node index.js $CONF
