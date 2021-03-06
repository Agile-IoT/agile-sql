[![Build Status](https://travis-ci.org/Agile-IoT/agile-sql.svg?branch=master)](https://travis-ci.org/Agile-IoT/agile-sql)

# AGILE SQL Connector

This connector can be used to enforce read and write policies on Tables by using the AGILE security framework.

## Getting Started

### Prerequisites

To use these modules, you should use agile-security version 3.7.1 or later. 

It needs to be made sure that the database defined in the configuration file (e.g. <code>database: 'agile'</code>) already exists on the database server or allow the automatic creation of databases, if they do not exist.

Agile-sql will automatically use the specified database on startup.

#### Option 1: Add database manually

##### 1. Add the components to the stack

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
    image: agileiot/agile-sqlparser-$AGILE_ARCH:v0.0.2
    container_name: sql-parser
    restart: always
    depends_on:
    - sql-db
    ports:
      - 9123:9123/tcp

  agile-sql:
   image: agileiot/agile-sql-$AGILE_ARCH:v0.1.1
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
##### 2. Start containers

     docker-compose up

##### 3. Connect to database container

     docker-compose exec sql-db /bin/bash
     
##### 4. Connect to database server

     mysql -u root -p

You will be prompted to enter the password. Depending on MYSQL_ROOT_PASSWORD in step 1 the password is <code>root</code>.
 
##### 5. List existing databases

    mysql> show databases;
    +--------------------+
    | Database           |
    +--------------------+
    | information_schema |
    | mysql              |
    | performance_schema |
    | sys                |
    +--------------------+

##### 6. Add database

If in the step before the required database is not listed, add it as follows:

    mysql> CREATE DATABASE agile;
    Query OK, 1 row affected (0.00 sec)

If you now list the databases again, the added database should be visible:

    mysql> show databases;
    +--------------------+
    | Database           |
    +--------------------+
    | information_schema |
    | agile              |
    | mysql              |
    | performance_schema |
    | sys                |
    +--------------------+

#### Option 2: Modify configuration
To let the database being added automatically, the configuration file must be adjusted accordingly. This can be done by setting the variable <code>createIfNotExists: true</code> in the configuration file.
Your configuration would be in your DATA path, which is commonly ~/.agile/agile-sql/agile-db.js. 

The configuration file could look as follows:

    module.exports = {
      db:{
        host: 'sql-db',
        user: 'root',
        port: 3306,
        password: 'root',
        database: 'agile'
      },
      client: {
        "id": "mysqlDB",
        "clientSecret": "Ultrasecretstuff"
      },
      sdk:{
        token:'',
        api: 'http://agile-core:8080',
        idm: 'http://agile-security:3000'
      },
      sqlParser:{
        host:'http://sql-parser:9123/'
      },
      log_level:'info',
      tablePolicy:[
        {
          op: "write",
          locks: [{
            lock: "hasType",
            args: ["/user"]
          }, {
            lock: "isOwner"
          }]
        },
        {
          op: "read",
          locks: [{
            lock: "hasType",
            args: ["/user"]
          }, {
            lock: "isOwner"
          }]
        }
      ],
      createIfNotExists: true
    }


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
curl -XPOST -d '{"query":"select * from user where User = ?", "values":["root"]}' -H "Content-type: application/json" -H "authorization: bearer $TOKEN" localhost:3005/query
```

Also, you could open the Node-RED interface from OSJS and paste the following flow:

```
[{"id":"776fda59.0fd774","type":"debug","z":"a92dce24.8962c8","name":"","active":true,"console":"false","complete":"false","x":204,"y":344,"wires":[]},{"id":"e76e2b5d.c7a7c8","type":"inject","z":"a92dce24.8962c8","name":"","topic":"","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"x":204,"y":62,"wires":[["ee20678.e0c1d18"]]},{"id":"62772546.7eb98c","type":"http request","z":"a92dce24.8962c8","name":"","method":"use","ret":"txt","url":"","tls":"","x":140,"y":261,"wires":[["6badb4ad.1ee6b4"]]},{"id":"c555d53.b1fe0a8","type":"function","z":"a92dce24.8962c8","name":"prepare-sql-call","func":"msg.url = 'http://agile-sql:3005/query'\nmsg.headers = {\n    \"Content-Type\":\"application/json\",\n    \"Authorization\":\"bearer \"+msg.token\n}\nmsg.method = 'POST'\nmsg.payload = {\n    \"query\":\"select * from user where User = ?\", \n    \"values\":[\"root\"]\n}\nreturn msg;","outputs":1,"noerr":0,"x":223,"y":191,"wires":[["62772546.7eb98c"]]},{"id":"ee20678.e0c1d18","type":"idm-token","z":"a92dce24.8962c8","name":"","tokensource":"session","idm":"http://agile-security:3000","userinfo":true,"x":224,"y":130,"wires":[["c555d53.b1fe0a8"]]},{"id":"6badb4ad.1ee6b4","type":"json","z":"a92dce24.8962c8","name":"","x":294,"y":262,"wires":[["776fda59.0fd774"]]}]
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
