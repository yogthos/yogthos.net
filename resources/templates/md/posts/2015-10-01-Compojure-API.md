{:title "Building services with Duct and compojure-api"
:layout :post
:tags ["clojure" "duct" "compojure-api"]}

In this post we'll look at writing a RESTful service using [Duct](https://github.com/weavejester/duct) and [compojure-api](https://github.com/metosin/compojure-api). Our service will use a SQLite database and illustrate how to do operations such as adding, remove, and authenticating users.

### Prerequisites

* [JDK](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)
* [Leiningen](http://leiningen.org/)

### Creating the Project

Duct is a minimal web framework with emphasis on using [component](https://github.com/stuartsierra/component) to manage stateful resources such as database connections. We can create a new Duct application by running the following command:

```
lein new duct swagger-service +example
```
This will generate a fresh application and add an example route component to it. Once the application is created we'll have to run the `setup` task to generate local assets in the root folder of the application:

```
cd swagger-service
lein setup
```

We can now test that our application works as follows:

```
lein run
```

If everything went well then we should be able to navigate to `localhost:3000` and see `Hello World` displayed on the page. We're now ready to start working on creating our service.

#### Adding Dependencies

We'll start by adding some dependencies in `project.clj` that we'll need in order to create our service:

```clojure
:dependencies
[...
 [crypto-password "0.1.3"]
 [metosin/compojure-api "0.23.1"]
 [org.xerial/sqlite-jdbc "3.8.11.1"]
 [yesql "0.5.0"]
 [migratus "0.8.4"]]
```

We'll use `crypto-password` to handle password hashing when we create user accounts and checking passwords during authentication. The `compojure-api` library will be used to generate the service endpoints. The `sqlite-jdbc` driver will be used as our data store, we'll access it using `yesql`, and we'll generate the database using `migratus`.

#### Configuring Migrations

Let's add the `migratus` plugin along with its configuration to our project:

```clojure
:plugins [[lein-environ "1.0.1"]
          [lein-gen "0.2.2"]
          [migratus-lein "0.1.7"]]

:migratus {:store :database             
           :db {:classname "org.sqlite.JDBC"
                :connection-uri "jdbc:sqlite:service-store.db"}}          
```

We can now run the following commands to generate the migration files for the `users` table:

```
mkdir resources/migrations
lein migratus create users
```

This will produce files for `up` and `down` migrations such as:

```sql
20151001145313-users.down.sql
20151001145313-users.up.sql
```

The `up` migrations file will create the table:

```sql
CREATE TABLE users
(id VARCHAR(20) PRIMARY KEY,
 first_name VARCHAR(30),
 last_name VARCHAR(30),
 email VARCHAR(30),
 admin BOOLEAN,
 last_login TIME,
 is_active BOOLEAN,
 pass VARCHAR(100));
```

Conversely, the `down` migrations file will delete it:

```sql
DROP TABLE users;
```
We can now run the following command to create the database:

```
lein migratus migrate
```
#### Adding Database Queries

With the database created, we'll need to add some queries to access the database. We'll create a new file called `resources/sql/queries.sql` and put the following SQL queries in it:

```sql
-- name: create-user!
-- creates a new user record
INSERT INTO users
(id, first_name, last_name, email, pass)
VALUES (:id, :first_name, :last_name, :email, :pass)

-- name: get-user
-- retrieve a user given the id.
SELECT * FROM users
WHERE id = :id

-- name: get-users
-- retrieve a user given the id.
SELECT id, first_name, last_name, email FROM users

-- name: delete-user!
-- delete a user given the id
DELETE FROM users
WHERE id = :id
```

### Creating the Database Component

Now, let's create a component that will be used to access it. We'll create a new namespace called `swagger-service.component.db` then put the following code there:

```clojure
(ns swagger-service.component.db
  (:require [yesql.core :refer [defqueries]]
            [com.stuartsierra.component :as component]
            [crypto.password.bcrypt :as password]
            [environ.core :refer [env]]))

(defqueries "sql/queries.sql")

(defn create-user-account! [user db]
  (create-user! (update user :pass password/encrypt) db))

(defn authenticate [user db]
  (boolean
   (when-let [db-user (-> user (get-user db) first)]
     (password/check (:pass user) (:pass db-user)))))

(defrecord DbComponent [connection]
  component/Lifecycle
  (start [component]
         (assoc component :connection connection))
  (stop [component]
        (dissoc component :connection)))

(defn db-component [connection]
  (->DbComponent connection))
```

The namespace will define query functions by calling the `defqueries` macro and giving it the path to the `queries.sql` file we just created.

Then we'll add a couple of helper functions to create a user account with a hashed password and to check whether the user and the password match the stored credentials.

Next, we define the `DbComponent` record that will manage the lifecycle of the database. The `start` function in the component will associate the given connection settings with the `:connection` key in the component, and the `stop` function will remove the connection.

The connection is specified in the `swagger-service.config` namespace and points to the `connection-uri` key that is expected to be found in the environment.

```clojure
(def environ
  {:http {:port (some-> env :port Integer.)}
   :db   {:connection-uri (:connection-uri env)}})
```   

We'll add the actual connection information under the `:env` key in `profiles.clj`:

```clojure
;; Local profile overrides

{:profiles/dev  {:env {:connection-uri "jdbc:sqlite:service-store.db"}}
 :profiles/test {}}
```

Finally, we have a helper function to instantiate the component called `db-component`.

#### Adding a New Component to the System

With the component created we can now add it to the system found in the `swagger-service.system` namespace:

```clojure
(ns swagger-service.system
 (:require ...
           [swagger-service.component.db :refer [db-component]]))

...
           
(defn new-system [config]
 (let [config (meta-merge base-config config)]
   (-> (component/system-map
        :db      (db-component (:db config))
        :app     (handler-component (:app config))
        :http    (jetty-server (:http config))
        :example (endpoint-component example-endpoint))
       (component/system-using
        {:http [:app]
         :app  [:example]
         :example []          
         :db []}))))            
```            

### Creating an HTTP Endpoint Component

The final step is to add the service endpoint that will provide the RESTful interface to the database. We'll create a new namespace called `swagger-service.endpoint.service`. The namespace will use the `compojure-api` library to define the service operations. The library requires us to declare the types of request parameters and responses for each endpoint using the [schema](https://github.com/Prismatic/schema) library.

Let's start by creating the namespace declaration with the following references:

```clojure
(ns swagger-service.endpoint.service
 (:require [clojure.java.io :as io]
           [ring.util.http-response :refer :all]
           [compojure.api.sweet :refer :all]
           [schema.core :as s]
           [swagger-service.component.db :as db]))
```

Then we'll create the schema for the User type that matches the user table in our database:

```clojure
(s/defschema User
 {:id String
  (s/optional-key :first_name) String
  (s/optional-key :last_name) String
  (s/optional-key :email) String
  (s/optional-key :pass) String})
```

Finally, let's create the `service-endpoint` component that will define the service routes. The component accepts the `config` as its parameter. The config will contain the `:db` key that we added to our system earlier with the database connection.

The routes are created by calling the `api` macro from `compojure-api`:

```clojure
(defn service-endpoint [config]
 (api
   (ring.swagger.ui/swagger-ui
    "/swagger-ui")
   (swagger-docs
    {:info {:title "User API"}})
   (context* "/api" []
             :tags ["users"]

             (GET* "/users" []
                   :return  [User]
                   :summary "returns the list of users"
                   (ok (db/get-users {} (:db config))))
             
             (GET* "/user/:id"  []
                   :return      User
                   :path-params [id :- String]
                   :summary     "returns the user with a given id"
                   (ok (db/get-users {:id id} (:db config))))

             (POST* "/authenticate" []
                    :return         Boolean
                    :body-params    [user :- User]
                    :summary        "authenticates the user using the id and pass."
                    (ok (db/authenticate user (:db config))))
             
             (POST* "/user"      []
                    :return      Long
                    :body-params [user :- User]
                    :summary     "creates a new user record."
                    (ok (db/create-user-account! user (:db config))))
             
             (DELETE* "/user"    []
                    :return      Long
                    :body-params [id :- String]
                    :summary     "deletes the user record with the given id."
                    (ok (db/delete-user! {:id id} (:db config)))))))
```

Notice that we call `ring.swagger.ui/swagger-ui` and `swagger-docs` at the beginning of the definition of `api`. This will automatically produce the API documentation for the service operations defined within it. Once our service is hooked up, we'll be able to navigate to `localhost:3000/swagger-ui` and see an interactive page for testing the API endpoints.

As you may have noticed, `compojure-api` mimics Compojure route definitions with the difference that the route method name has a `*` after it. The route definition also has some additional keys associated with it.

* the `:return` key specifies the return type for the service operation
* the `:summary` key provides the documentation about the purpose of the operation
* the parameters are specified using different keys depending on the parameter type, such as `:path-params` and `:body-params`.

Finally, each route will return a response type with the result of calling the handler associated with it.

If we look at the `"/users"` route we see that it calls the `get-users` function from the database and passes it the value of the `:db` key from the config. This will be used to resolve the database connection at runtime.

### Adding the Endpoint to the System

With the route added we can now navigate back to the `swagger-service.system` namespace and add the component there:

```clojure
(ns swagger-service.system
 (:require ...
           [swagger-service.component.db :refer [db-component]]
           [swagger-service.endpoint.service :refer [service-endpoint]]))
           
...

(defn new-system [config]
 (let [config (meta-merge base-config config)]
   (-> (component/system-map
        :db      (db-component (:db config))
        :app     (handler-component (:app config))
        :http    (jetty-server (:http config))
        :example (endpoint-component example-endpoint)
        :service (endpoint-component service-endpoint))
       (component/system-using
        {:http [:app]
         :app  [:example :service]
         :service [:db]
         :example []          
         :db []}))))            
```

The service component is initialized using the `endpoint-component` Duct helper. Next, the component relationships have to be described explicitly. We can see that the `:service` component depends on the `:db` component, and the `:app` in turn depends on both the `:example` and the `:service`.

We can now restart our app and navigate to `localhost:3000/swagger-ui` to see the service test page. Using this page we can test all the service operations that we defined such as creating new users, authenticating, and listing users.

The full source for this tutorial is available on [GitHub](https://github.com/yogthos/swagger-service).

### Conclusion

As you can see, `compojure-api` allows us to easily define RESTful services with type assertions, documentation, and a helpful test page. I've found this approach to be extremely effective when creating service APIs as it documents what each endpoint is doing and makes it easy to collaborate with consumers of the service. Meanwhile, Duct provides an excellent base for building services using the component pattern.