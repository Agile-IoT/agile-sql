[![Build Status](https://travis-ci.org/Agile-IoT/agile-sql.svg?branch=master)](https://travis-ci.org/Agile-IoT/agile-sql)

# AGILE SQL Connector

This connector can be used to enforce read and write policies on Tables by using the AGILE security framework.

## Getting Started

To use these modules, you should use agile-security version 3.7.0 or later (as this is the earliest version with database entity support)

### Add the components to the stack

Add the following micro-services to your docker-compose file


```
  sql-db:
    #In a rpi use this one 
    image: hypriot/rpi-mysql
    #For intel use this one
    #image: mysql
    container_name: sql-db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
    ports:
      - 3306:3306/tcp

  sql-parser:
    image: agileiot/agile-sqlparser-$AGILE_ARCH:v0.0.1
    container_name: sql-parser
    restart: always
    depends_on:
    - sql-db
    ports:
      - 9123:9123/tcp

  agile-sql:
   image: agileiot/agile-sql-$AGILE_ARCH:v0.0.4
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


## Create the client

By default, agile-sql maps the database it is configured to connect to with agile-security when it boots.

However, in order for this to work smoothly, you need to assign a valid (Oauth2) client from agile-security in the configuration.

To create the client, visit the Device Manager UI and:
  * go to the client tab
  * click on ADD NEW
  * add the name and id ``mysqlDB`` and set as clientSecret  ``Ultrasecretstuff``
  * These values are meant for demonstration purposes! to actually deploy an instance of the agile-sql service, you should update your configuration.
  * According to the docker-compose snippet shown before your configuration would be in $DATA/agile-sql/agile-db.js . Which is commonly ~/.agile/agile-sql/agile-db.js

## Start the example

Whenever agile-sql starts, it tries to map all the tables from the database which it is configured to use to an agile-security entity of type ``database``. To this end, the default policy from the configuration file of agile-sql is used for all the tables encountered in the database. These policies can be updated later (for more information see below)

When agile-sql starts it copies the configuration files from the repository to the location mounted from the host (as shown in the docker-compose snippet above). This will connect as a root user to the mysql database (in the sql-db container).

## Agile-sql configuration

* ``db:`` details to the database where queries shall be executed (if policies are matched by the AGILE user sending the request)
``client:`` Information about the Oauth2 agile-security client used to automatically register all the tables in the database using the default policy

* ``sdk:`` Configuration for the agile-sdk to interact with agile-security in the gateway

* ``sqlParser``: Location of the sql-parser (agile-sqlparser container) to find out which tables are affected by which kind of opperations in order to evaluate the security policies

* ``tablePolicy``: Default policies used for tables when they are automatically registered (this takes effect only when the agile-sql container is started for the first time)


## Executing a Sample Query

To facilitate adoption of this module, we have created a default configuration that automatically maps to the ``mysql`` database in a fresh MySQL installation.  Thus, if the policy decision point allow this, queries will be executed with the root user on this database. **this is only meant for demonstration purposes:** you should update the password, username and database information according to your necessities


Assuming you have obtained a token from agile-security, e.g. get it after you have logged in through the OS.js interface. Assing it to the TOKEN shell variable and the execute the following request:

```
curl -XPOST -d '{"query":"select * from user where Host = ?", "values":["localhost"]}' -H "Content-type: application/json" -H "authorization: bearer $TOKEN" localhost:3005/query
```

Also, you could open the Node-RED interface from OSJS and paste the following flow:

```
[{"id":"94e32303.1a9eb8","type":"debug","z":"4b40eac7.d65504","name":"","active":true,"console":"false","complete":"false","x":232,"y":328,"wires":[]},{"id":"d371c239.701ce8","type":"inject","z":"4b40eac7.d65504","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"x":232,"y":46,"wires":[["4b2dd8b8.85fd78"]]},{"id":"518d65ad.5f10e4","type":"http request","z":"4b40eac7.d65504","name":"","method":"use","ret":"txt","url":"","tls":"","x":168,"y":245,"wires":[["a74cbf55.664ab8"]]},{"id":"267cbc7.e1bf044","type":"function","z":"4b40eac7.d65504","name":"prepare-sql-call","func":"msg.url = 'http://agile-sql:3005/query'\nmsg.headers = {\n    \"Content-Type\":\"application/json\",\n    \"Authorization\":\"bearer \"+msg.token\n}\nmsg.method = 'POST'\nmsg.payload = {\n    \"query\":\"select * from user where Host = ?\", \n    \"values\":[\"localhost\"]\n}\nreturn msg;","outputs":1,"noerr":0,"x":251,"y":175,"wires":[["518d65ad.5f10e4"]]},{"id":"4b2dd8b8.85fd78","type":"idm-token","z":"4b40eac7.d65504","name":"","tokensource":"session","idm":"http://agile-security:3000","userinfo":true,"x":252,"y":114,"wires":[["267cbc7.e1bf044"]]},{"id":"a74cbf55.664ab8","type":"json","z":"4b40eac7.d65504","name":"","x":322,"y":246,"wires":[["94e32303.1a9eb8"]]}]
```

This flow can be triggered by clicking on the timestamp node, and it will obtain the token for the user logged in currently in Node-Rer, and then send the same request as shown in the curl line to the agile-sql container.


## Updating Policies for Particular Tables

It is possible to enable the AGILE UI to show the policies for the database objects created.

For this the configuration located in $DATA/security/idm/conf/agile-ui-conf.js (ussualy located in the host at ~/.agile/security/idm/conf/agile-ui-conf.js). And update the object ``database`` inside the ``gui`` field of the configuration by changing ``hidden`` to false.

Then, the policies for the particular tables will be visible in the Device Manager UI, in the tab DATABASE (the one you just made visible) and then inside the policies (under actions.tables).

## Troubleshooting


I am seeing this error in the logs:

```
agile-sql                | error:  Error: Request failed with status code 401
agile-sql                |     at createError (/opt/app/node_modules/agile-sdk/node_modules/axios/lib/core/createError.js:15:15)
agile-sql                |     at settle (/opt/app/node_modules/agile-sdk/node_modules/axios/lib/core/settle.js:18:12)
agile-sql                |     at IncomingMessage.handleStreamEnd (/opt/app/node_modules/agile-sdk/node_modules/axios/lib/adapters/http.js:186:11)
agile-sql                |     at emitNone (events.js:91:20)
agile-sql                |     at IncomingMessage.emit (events.js:188:7)
agile-sql                |     at endReadableNT (_stream_readable.js:975:12)
agile-sql                |     at _combinedTickCallback (internal/process/next_tick.js:80:11)
agile-sql                |     at process._tickCallback (internal/process/next_tick.js:104:9)
agile-sql                | error:  TypeError: Cannot read property 'end' of undefined
agile-sql                |     at DB.close (/opt/app/mysql.js:117:18)
agile-sql                |     at agile.idm.authentication.authenticateClient.then.then.then.catch (/opt/app/index.js:87:13)
agile-sql                |     at process._tickCallback (internal/process/next_tick.js:109:7)
agile-sql                | /usr/bin/entry.sh: line 93: fg: job has terminated
agile-sql                | checking if configuration is in folder /etc/agile-sql

```

This means you have not created the Oauth2 client matching the configuration file of your agile-sql instance. Without this, agile-sql cannot map your database to agile-security entities. To create it follow the steps nentioned above.
