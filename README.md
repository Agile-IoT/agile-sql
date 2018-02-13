[![Build Status](https://travis-ci.org/Agile-IoT/agile-sql.svg?branch=master)](https://travis-ci.org/Agile-IoT/agile-sql)

# AGILE SQL Connector

This connector can be used to enforce read and write policies on Tables by using the AGILE security framework.

## Getting Started

To use these modules, you should use agile-security version

### Add the components to the stack

Add the following micro-services to your docker-compose file


```
  sql-db:
    image: mysql
    container_name: sql-db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
    ports:
      - 3306:3306/tcp

  sql-parser:
    image: agileiot/agile-sqlparser-$AGILE_ARCH:latest
    container_name: sql-parser
    restart: always
    depends_on:
    - sql-db
    ports:
      - 9123:9123/tcp

  agile-sql:
   image: agileiot/agile-sql-$AGILE_ARCH:v0.0.3
   container_name: agile-sql
   restart: always
   depends_on:
    - sql-parser
    - sql-db
   ports:
    - 3005:3005/tcp
   volumes:
    - $DATA/agile-sql/:/etc/agile-sql/    
```


# Create the client

By default, agile-sql maps the database it is configured to connect to with agile-security when it boots.

However, in order for this to work smoothly, you need to assign a valid (Oauth2) client from agile-security in the configuration.

To create the client, visit the Device Manager UI and:
  * go to the client table
  * click on
  * add the name and id ``mysqlDB`` and set as clientSecret  ``Ultrasecretstuff``
  * These values are meant for demonstration purposes! to actually deploy an instance of the agile-sql service, you should update your configuration.
  * According to the docker-compose snippet shown before your configuration would be in $DATA/agile-sql/agile-db.js . Which is commonly ~/.agile/agile-sql/agile-db.js

## Executing a Query

Assuming you have obtained a token from agile-security, e.g. get it after you have logged in through the OS.js interface. Assing it to the TOKEN shell variable and the execute the following request:

```
curl -XPOST -d '{"query":"select * from user where Host = ?", "values":["localhost"]}' -H "Content-type: application/json" -H "authorization: bearer $TOKEN" localhost:3005/query
```

# Updating Policies for Particular Tables

It is possible to enable the AGILE UI to show the policies for the database objects created.

For this the configuration located in $DATA/security/idm/conf/agile-ui-conf.js (ussualy located in the host at ~/.agile/security/idm/conf/agile-ui-conf.js). And update the object ``database`` inside the ``gui`` field of the configuration by changing ``hidden`` to false.

Then, the policies for the particular tables will be visible in the Device Manager UI, in the tab DATABASE (the one you just made visible) and then inside the policies (under actions.tables).
