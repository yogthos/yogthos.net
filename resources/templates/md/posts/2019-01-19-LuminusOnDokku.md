{:title "Running Luminus on Dokku"
 :layout :post
 :tags ["clojure" "luminus" "dokku"]}

Luminus provides a great way to get up and running with a Clojure web application. However, building your app is only half the work. Once you've got your app working, the next step is to host it somewhere so that the users can access it.

Cloud platforms, such as AWS, are a popular choice for deploying large scale solutions. On the other hand, VPS services like Digital Ocean and Linode provide a more economical alternative for small scale applications. The downside of running your own VPS is that managing it can be labor intensive. This is where [Dokku](http://dokku.viewdocs.io/dokku/) comes in. It's a private PaaS modelled on Heroku that you can use to provision a VPS.

Let's take a look at what's involved in provisioning a Digital Ocean droplet with Dokku and deploying a Luminus web app to it.

### Set up the server

Let's create a droplet with Ubuntu LTS (18.0.4 at the time of writing) and SSH into it. We'll need to add new APT repositories before we install Dokku.
 
1. add the universe repository`sudo add-apt-repository universe`
2. add the key `wget -nv -O - https://packagecloud.io/dokku/dokku/gpgkey | apt-key add -`
3. add the Dokku repo `echo "deb https://packagecloud.io/dokku/dokku/ubuntu/ bionic main" > /etc/apt/sources.list.d/dokku.list`

Once the repositories are added, we'll need to update the dependencies and install Dokku.

1. update dependencies `sudo apt-get update && sudo apt-get upgrade`
2. install dokku `apt-get install dokku`

Once Dokku is installed, we'll create an application and a Postgres database instance.

* create the app `dokku apps:create myapp`
* install [dokku-postgres plugin](https://github.com/dokku/dokku-postgres) `sudo dokku plugin:install https://github.com/dokku/dokku-postgres.git`
* create the db `dokku postgres:create mydb`
* link the db to the app `dokku postgres:link mydb myapp`

We're now ready to deploy the app.

### Create a new Luminus application

Let's create a Luminus application on your local machine.

1. `lein new luminus myapp +postgres`
2. `cd myapp`

Let's update the app to run migrations on startup by updating the `myapp.core/start-app` function to run the migrations.

```clojure
(defn start-app [args]
  (doseq [component (-> args
                        (parse-opts cli-options)
                        mount/start-with-args
                        :started)]
    (log/info component "started"))

  ;;run migrations  
  (migrations/migrate ["migrate"] (select-keys env [:database-url]))

  (.addShutdownHook (Runtime/getRuntime) (Thread. stop-app)))
```

Next, we need to update `env/prod/resources/logback.xml` to use `STDOUT` for the logs:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <statusListener class="ch.qos.logback.core.status.NopStatusListener" />
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <!-- encoders are assigned the type
             ch.qos.logback.classic.encoder.PatternLayoutEncoder by default -->
        <encoder>
            <charset>UTF-8</charset>
            <pattern>%date{ISO8601} [%thread] %-5level %logger{36} - %msg %n</pattern>
        </encoder>
    </appender>
    <logger name="org.apache.http" level="warn" />
    <logger name="org.xnio.nio" level="warn" />
    <logger name="com.zaxxer.hikari" level="warn" />
    <root level="INFO">
        <appender-ref ref="STDOUT" />
    </root>
</configuration>
```

### Deploy the application to Dokku

We're now ready to deploy the app. First, we'll need to create a Git repo and add the app contents to it.

1. `git init`
2. `git add .gitignore Procfile project.clj README.md src/* env/* test/* resources/*`
3. `git commit -a -m "initial commit"`

Next, we'll add the remote for the Dokku repository on the server and push the project to the remote. Dokku will automatically build the project once it's pushed, and deploy the application when the build is successful.

1. `git remote add dokku dokku@<server name>:myapp`
2. `git push dokku master`

The app will be pushed to the server where it will be compiled and run. If everything went well you should see output that looks something like the following:

```
...
-----> Building with Leiningen
       Running: lein uberjar
       Compiling sample.app
       2019-01-18 01:10:30.857:INFO::main: Logging initialized @6674ms to org.eclipse.jetty.util.log.StdErrLog
       Created /tmp/build/target/myapp-1.0.1.jar
       Created /tmp/build/target/myapp.jar
...
=====> web=1
...
-----> Waiting for 10 seconds ...
-----> Default container check successful!
-----> Running post-deploy
-----> Configuring myapp.<server name>...(using built-in template)
-----> Creating http nginx.conf
-----> Running nginx-pre-reload
       Reloading nginx
-----> Setting config vars
       DOKKU_APP_RESTORE:  1
=====> 8dc31ac11011111117f71e4311111ca5962cf316411d5f0125e87bbac26
=====> Application deployed:
       http://myapp.<server name>

To http://<server name>:myapp
   6dcab39..1c0c8b7  master -> master
```

We can check the status of the application in the logs by running `dokku logs myapp` command on the server. The output should looks something like the following.

```Setting JAVA_TOOL_OPTIONS defaults based on dyno size. Custom settings will override them.
Picked up JAVA_TOOL_OPTIONS: -Xmx300m -Xss512k -XX:CICompilerCount=2 -Dfile.encoding=UTF-8
2019-01-19 19:09:48,258 [main] INFO  myapp.env -
-=[myapp started successfully]=-
2019-01-19 19:09:50,490 [main] INFO  luminus.http-server - starting HTTP server on port 5000
2019-01-19 19:09:50,628 [main] INFO  org.xnio - XNIO version 3.3.6.Final
2019-01-19 19:09:51,236 [main] INFO  org.projectodd.wunderboss.web.Web - Registered web context /
2019-01-19 19:09:51,242 [main] INFO  myapp.core - #'myapp.config/env started
2019-01-19 19:09:51,243 [main] INFO  myapp.core - #'myapp.db.core/*db* started
2019-01-19 19:09:51,243 [main] INFO  myapp.core - #'myapp.handler/init-app started
2019-01-19 19:09:51,244 [main] INFO  myapp.core - #'myapp.handler/app started
2019-01-19 19:09:51,249 [main] INFO  myapp.core - #'myapp.core/http-server started
2019-01-19 19:09:51,249 [main] INFO  myapp.core - #'myapp.core/repl-server started
2019-01-19 19:09:51,250 [main] INFO  myapp.core - running migrations
2019-01-19 19:09:51,257 [main] INFO  migratus.core - Starting migrations
2019-01-19 19:09:51,418 [main] INFO  migratus.database - creating migration table 'schema_migrations'
2019-01-19 19:09:51,992 [main] INFO  migratus.core - Running up for [20190118214013]
2019-01-19 19:09:51,997 [main] INFO  migratus.core - Up 20190118214013-add-users-table
2019-01-19 19:09:52,099 [main] INFO  migratus.core - Ending migrations
```

You should now be able to check your application in the browser by navigating to `http://<server name>`.

### Troubleshooting the database

The startup logs for the application indicate that it was able to connect to the database and run the migrations successfully. Let's confirm this is the case by connecting a `psql` shell to the database container on the server.

```
dokku postgres:connect mydb
mydb=# \d
               List of relations
 Schema |       Name        | Type  |  Owner
--------+-------------------+-------+----------
 public | schema_migrations | table | postgres
 public | users             | table | postgres
(2 rows)
```

We can see that the database contains the `schema_migrations` table and the `users` table that were created when the app migrations ran.

Sometimes it might be useful to connect a more advanced client such as [DBeaver](https://dbeaver.io/). This can done by exposing the database on the server using the following command.

```
sudo dokku postgres:expose mydb 5000
```

Next, we'll enter the container for the application to get the database connection details.

```
dokku enter myapp web
echo $DATABASE_URL
```

The `DATABASE_URL` environment variable in the container will contain the connection string that looks as follows.

```
postgres://postgres:<password>@dokku-postgres-mydb:5432/mydb
```

We can now map the port to the local machine using SSH, and connect to the database as if it was running on the local machine using the connection settings above. 

```
ssh -L 5432:localhost:5000 <server name>
```

### Set up HTTPS

As the last step we'll set up HTTPS for the application using [dokku-letsencrypt](https://github.com/dokku/dokku-letsencrypt) plugin. We'll set the app to run on the root domain on the server.

1. add the root domain to the app `dokku domains:add myapp <server name>`
2. remove the subdomain from the app `dokku domains:remove myapp myapp.<server name>`
3. install the plugin `sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git`
4. set the email for renewal warnings `dokku config:set --no-restart myapp DOKKU_LETSENCRYPT_EMAIL=<your email>`
5. add HTTPS to the app `sudo dokku letsencrypt myapp`
6. set up auto-renew for the certificate `dokku letsencrypt:auto-renew`

That's all there is to it. The application is now deployed to the droplet, it's hooked up to the database, and it's using Let's Encrypt SSL/TLS Certificates.

Any further updates to the application simply involve committing the changes to the local Git repo and pushing them to the server as we did with our initial deploy.

I recommend taking look at the [official documentation](http://dokku.viewdocs.io/dokku/getting-started/installation/) on the Dokku site for more information about Dokku. I think it provides an excellent solution for running your VPS. If you're evaluating different options for deploying your Clojure apps give Dokku a look.