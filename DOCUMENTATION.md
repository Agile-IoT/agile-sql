# Prerequisites
To use these modules, you should use agile-security version 3.7.1 or later. 

It needs to be made sure that the database defined in the configuration file (e.g. <code>database: 'agile'</code>) already exists on the database server or allow the automatic creation of databases, if they do not exist.

Agile-sql will automatically use the specified database on startup.
## Add Database manually

The first option, to add the database is to log into the database server and add the database manually.
### 1. Add micro-services to docker-compose
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
### 2. Start containers

     docker-compose up

### 3. Connect to database container

     docker-compose exec sql-db /bin/bash
     
### 4. Connect to database server

     mysql -u root -p

You will be prompted to enter the password. Depending on MYSQL_ROOT_PASSWORD in step 1 the password is <code>root</code>.
 
### 5. List existing databases

    mysql> show databases;
    +--------------------+
    | Database           |
    +--------------------+
    | information_schema |
    | mysql              |
    | performance_schema |
    | sys                |
    +--------------------+

### 6. Add database

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

## Modify configuration
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


## Modules

<dl>
<dt><a href="#module_utils">utils</a></dt>
<dd><p>A module providing common functionalities for this application</p>
</dd>
</dl>

## Classes

<dl>
<dt><a href="#Configurator">Configurator</a></dt>
<dd></dd>
<dt><a href="#Mysql">Mysql</a></dt>
<dd></dd>
<dt><a href="#QueryEnforcer">QueryEnforcer</a></dt>
<dd></dd>
<dt><a href="#ParserConnector">ParserConnector</a></dt>
<dd></dd>
</dl>

<a name="module_utils"></a>

## utils
A module providing common functionalities for this application

<a name="module_utils..dbId"></a>

### utils~dbId()
This function builds a unique id based on the host and database name

**Kind**: inner method of [<code>utils</code>](#module_utils)  
<a name="Configurator"></a>

## Configurator
**Kind**: global class  

* [Configurator](#Configurator)
    * [new Configurator(agile, db, conf)](#new_Configurator_new)
    * [.mapDB()](#Configurator.mapDB) ⇒ <code>Promise</code>
    * [.mapTable(tables)](#Configurator.mapTable) ⇒ <code>Promise</code>

<a name="new_Configurator_new"></a>

### new Configurator(agile, db, conf)
Creates a new instance of a Configurator.
This object is capable of inspecting an existing database, and registering it to
agile-security


| Param | Type | Description |
| --- | --- | --- |
| agile | <code>Object</code> | sdk object to register the database entity and its default policies in agile-security |
| db | <code>Object</code> | instance of Mysql object, used to list all the tables in order to register them in agile |
| conf | <code>Object</code> | object with the  client key. under the client key an object containing a valid client id and clientSecret is needed. As this information is used to retrieve a token from agile-security and then register all the tables through this client, i.e., on behalf of the client's owner. Also the conf object should have a "tablePolicy" key under which the INITIAL default policy for EVERY table is specified. |

<a name="Configurator.mapDB"></a>

### Configurator.mapDB() ⇒ <code>Promise</code>
**Kind**: static method of [<code>Configurator</code>](#Configurator)  
**Summary**: This function queries the sql database and registers all the tables with the default policies.
The default policy comes from the configuration object provided during creation  
**Access**: public  
**Fulfil**: <code>void</code> resolves without an argument  
**Example**  
```js
configurator.mapDB().then(function() {
  console.log();
});
```
### Configurator.mapTable(tables) ⇒ <code>Promise</code>
**Kind**: static method of [<code>Configurator</code>](#Configurator)  
**Summary**: This function queries the sql database and registers all the tables passed as the parameter with the default policies.
The default policy comes from the configuration object provided during creation  
**Access**: public  
**Fulfil**: <code>void</code> resolves without an argument 

| Param | Type | Description |
| --- | --- | --- |
| query | <code>Array</code> | table names |
 
**Example**  
```js
configurator.mapTable(tables).then(function() {
  console.log();
});
```

<a name="Mysql"></a>

## Mysql
**Kind**: global class  

* [Mysql](#Mysql)
    * [new Mysql(conf)](#new_Mysql_new)
    * [.init()](#Mysql.init) ⇒ <code>Promise</code>
    * [.execQuery(query)](#Mysql.execQuery) ⇒ <code>Promise</code>
    * [.getAllTables()](#Mysql.getAllTables) ⇒ <code>Promise</code>
    * [.close()](#Mysql.close)

<a name="new_Mysql_new"></a>

### new Mysql(conf)
Creates a new Mysql connection.


| Param | Type | Description |
| --- | --- | --- |
| conf | <code>Object</code> | must include the connection confuration (host,user,password and database) |

<a name="Mysql.init"></a>

### Mysql.init() ⇒ <code>Promise</code>
**Kind**: static method of [<code>Mysql</code>](#Mysql)  
**Summary**: Initialize the connection to the mysql backend  
**Access**: public  
<a name="Mysql.execQuery"></a>

### Mysql.execQuery(query) ⇒ <code>Promise</code>
**Kind**: static method of [<code>Mysql</code>](#Mysql)  
**Summary**: Execute query on the backend. This function does not check policies, just executes SQL  
**Access**: public  
**Fulfil**: <code>Object</code> with results property containing an array of objects, where each object has the name of the column as key and the value of the row for that key as the value.
For example if the table User in the example had two rows containing a user with name mark and email m@mk.com and another one called john with email john@jn.com the object
returned when the promise resolves woul be: {results:[{name:'john', email:'john@hn.com'},{ name:'mark', email:' m@mk.com'}]}  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>String</code> | SQL query |

**Example**  
```js
mysqlobject.execQuery('SELECT * FROM User').then(function(data) {
  console.log(data.results);
});
```
<a name="Mysql.getAllTables"></a>

### Mysql.getAllTables() ⇒ <code>Promise</code>
**Kind**: static method of [<code>Mysql</code>](#Mysql)  
**Summary**: Gets all table names for the current database  
**Access**: public  
**Fulfil**: <code>Array</code> names - Strings representing names of tables  
<a name="Mysql.close"></a>

### Mysql.close()
**Kind**: static method of [<code>Mysql</code>](#Mysql)  
**Summary**: closes the database connection synchronously  
**Access**: public  
<a name="QueryEnforcer"></a>

## QueryEnforcer
**Kind**: global class  

* [QueryEnforcer](#QueryEnforcer)
    * [new QueryEnforcer(agile, conf, mapping)](#new_QueryEnforcer_new)
    * [.evaluatePolicy(tablesAffected)](#QueryEnforcer.evaluatePolicy) ⇒ <code>Promise</code>
    * [.checkParseResults(tablesAffected)](#QueryEnforcer.checkParseResults) ⇒ <code>Promise</code>

<a name="new_QueryEnforcer_new"></a>

### new QueryEnforcer(agile, conf, mapping)
Creates a new instance of QueryEnforcer.
This class evaluates policies by relying on agile-security


| Param | Type | Description |
| --- | --- | --- |
| agile | <code>Object</code> | agile-sdk object used to check policies |
| conf | <code>Object</code> | object containing the database configuration |
| mapping | <code>Object</code> | object containing mapping between read and write actions and SQL keywords such as INSERT, DELETE, etc. Usually loaded from conf folder. |

<a name="QueryEnforcer.evaluatePolicy"></a>

### QueryEnforcer.evaluatePolicy(tablesAffected) ⇒ <code>Promise</code>
**Kind**: static method of [<code>QueryEnforcer</code>](#QueryEnforcer)  
**Summary**: This function receives an object with actions and tables,
as the one returned by sqlparser.parseQueryIntoActionsOnTables and evaluates
whether the current user can execute the query  
**Access**: public  
**Fulfil**: <code>void</code> resolves if the sql query can be ejecuted, or rejects with an error otherwise.
For additional information, what happens under the hood is that for each table affected the agile.pdp is called.
For example, if the tablesAffected argument has  {"DELETE":[],"CREATE":[],"MERGE":[],"UPSERT":[],"UPDATE":[],"INSERT":[],"REPLACE":[],"SELECT":["user"]},
Then, assuming a database with id (autogenerated by the configurator based on host and dbname)
"sql-db-mysql", the call to the pdp would contain the following body:
{"entityId":"sql-db-mysql","entityType":"database","field":"actions.tables.user","method":"read"}
This evaluates whether the table user can be read by the user currently logged in  

| Param | Type | Description |
| --- | --- | --- |
| tablesAffected | <code>Object</code> | argument as returned by sqlparser.parseQueryIntoActionsOnTables |

**Example**  
```js
enforcer.evaluatePolicy(tablesAffected).then(function(results) {
  console.log(results);
});
```
<a name="QueryEnforcer.checkParseResults"></a>

### QueryEnforcer.checkParseResults(tablesAffected) ⇒ <code>Promise</code>
**Kind**: static method of [<code>QueryEnforcer</code>](#QueryEnforcer)  
**Summary**: This function receives an object with actions and tables,
as the one returned by sqlparser.parseQueryIntoActionsOnTables and resolves with
an Object containing the actions and the tables affected in order to use this later
for the policy evaluation.  
**Access**: public  
**Fulfil**: <code>Object</code> with the keys "read" and "write" where each key contains an array
of table names affected by read or writes respectively.
Following the example of usage from the sql parser, if
the folowing object mapping SQL statements to tables:
{"DELETE":[],"CREATE":[],"MERGE":[],"UPSERT":[],"UPDATE":[],"INSERT":[],"REPLACE":[],"SELECT":["user"]}
would yield the following result from this function * {"read":["user"]} as the SELECT is a read action on the table user.  

| Param | Type | Description |
| --- | --- | --- |
| tablesAffected | <code>Object</code> | argument as returned by sqlparser.parseQueryIntoActionsOnTables |

**Example**  
```js
enforcer.checkParseResults(tablesAffected).then(function(results) {
  console.log(results);
});
```
<a name="ParserConnector"></a>

## ParserConnector
**Kind**: global class  

* [ParserConnector](#ParserConnector)
    * [new ParserConnector(hostParser)](#new_ParserConnector_new)
    * [.parseQueryIntoActionsOnTables(query)](#ParserConnector.parseQueryIntoActionsOnTables) ⇒ <code>Promise</code>

<a name="new_ParserConnector_new"></a>

### new ParserConnector(hostParser)
Creates a new instance of ParserConnector.
This connector calls an external service to find out which SQL statements, e.g., SELECT, UPDATE, etc,
affect which tables


| Param | Type | Description |
| --- | --- | --- |
| hostParser | <code>String</code> | URL to contact the external sql parsing service |

<a name="ParserConnector.parseQueryIntoActionsOnTables"></a>

### ParserConnector.parseQueryIntoActionsOnTables(query) ⇒ <code>Promise</code>
**Kind**: static method of [<code>ParserConnector</code>](#ParserConnector)  
**Summary**: This function parses a SQL query, in order to detech which tables are affected by which actions.
This is the first step towards defining reading and writing policies on tables.  
**Access**: public  
**Fulfil**: <code>Object</code>  and returns an object mapping the following keywords:
DELETE, CREATE, MERGE, UPSERT, UPDATE, INSERT, REPLACE, SELECT to tables affected by them. For instance,
if this function is called with a "SELECT * from User" query the following response is expected:
{"DELETE":[],"CREATE":[],"MERGE":[],"UPSERT":[],"UPDATE":[],"INSERT":[],"REPLACE":[],"SELECT":["user"]}  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>String</code> | SQL Query |

**Example**  
```js
connector.parseQueryIntoActionsOnTables(query).then(function(results) {
  console.log(results);
});
```
