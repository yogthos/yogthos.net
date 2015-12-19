{:title "Noir tutorial - part 7",
 :layout :post,
 :tags ["noir" "clojure"]}

In the [last part](http://yogthos.net/blog/28-Noir+tutorial+-+part+6) of the tutorial we saw how we can use a request handler wrapper to fix the redirect URLs. There is another option for doing this that I'd like to mention.

As we've seen, the `defpage` params only contain form parameters, but there is a way to access the complete parameter map provided by `ring` using the `noir.request/ring-request` helper. 

If the application is running on a servlet its context will show up in this map and we can use it in our redirects. We can write a simple macro called `local-redirect` which will do this for us:
```clojure
(defmacro local-redirect [url]
  `(noir.response/redirect 
     (if-let [context# (:context (noir.request/ring-request))]
       (str context# ~url) ~url)))
```
The advantage to this approach is that we do not try to infer if the redirect is supposed to be local or not. If we want to redirect to the local servlet context we can do it explicitly, and if we wish to do an absolute redirect then we can use the `noir.response/redirect` directly.

With that out of the way, I'd like to cover using the servlet init function and accessing files located on the classpath of the servlet. This allows us to run a function once when our serlvet starts up. 

For example, we might want to read in a configuration file and setup some environment parameters based on it. To do that we'll open up our `project.clj` and add an `:init` key to our map or ring parameters:
```clojure
(defproject my-website "0.1.0-SNAPSHOT"
            :description "my Noir website"
            :dependencies [[org.clojure/clojure "1.4.0"]
                           [noir "1.3.0-beta3"]
                           [org.clojure/java.jdbc "0.2.3"]
                           [postgresql/postgresql "9.1-901.jdbc4"]
                           [joda-time "2.0"]]
            :dev-dependencies [[lein-ring "0.7.3"]]
            :ring {:handler my-website.server/handler

                   ;;initialization function which will be run 
                   ;;once when the servlet is loaded
                   :init my-website.config/init-config}
            :main my-website.server)
```

**update:** with Leiningen 2.0 you will need to use `:plugins` instead of `:dev-dependencies` to get `lein-ring` to work correctly:

```clojure
(defproject my-website "0.1.0-SNAPSHOT"
            :description "my Noir website"
            :dependencies [[org.clojure/clojure "1.4.0"]
                           [noir "1.3.0-beta3"]
                           [org.clojure/java.jdbc "0.2.3"]
                           [postgresql/postgresql "9.1-901.jdbc4"]
                           [joda-time "2.0"]]

            ;;lein 2
            :plugins [[lein-ring "0.7.5"]]
            ;;lein 1
            :dev-dependencies [[lein-ring "0.7.3"]]

            :ring {:handler my-website.server/handler

                   ;;initialization function which will be run 
                   ;;once when the servlet is loaded
                   :init my-website.config/init-config}
            :main my-website.server)
```


Now we'll create a new namespace which the `:init` key is pointing to, and create an `init-config` function in it:
```clojure
(ns my-website.config
  (:use clojure.java.io))

(defn init-config [] 
  (println "servlet has been initialized"))
```
If you build and deploy the application, the "servlet has been initialized" message is printed in the server log once after deployment. Now, let's add a configuration file in our `resources` folder:
```bash
touch my_webapp/resources/site.config
```
When we run `lein ring uberwar` this file will be packaged under `/WEB-INF/classes/` path in the servlet. To access this file we'll need to add the following function to our config namespace:
```clojure
(def config-file "site.config")

(defn load-config-file []
  (let [url (.. 
              (Thread/currentThread) 
              getContextClassLoader 
              (findResource config-file))] 
    (if (or (nil? url) 
            (.. url 
              getPath 
              (endsWith (str "jar!/" config-file))))
      (doto (new java.io.File config-file) 
        (.createNewFile))
      url)))
```
The `load-config-file` function will get the context class loader and attempt to find the resource by name. If the resource is found we will get back a URL pointing to it. Unfortunately, if we're running as a standalone jar, we cannot modify the resource inside it. So, in case the URL is nil, meaning that the file was not found, or if it ends with "jar!/site.config" we will create a new file instead. When running standalone, the file will be created in the same folder as the jar.

Now that we have a function to read the configuration, let's load it so we can actually use it. To do that we will add an atom to hold the configuration, and update our init-config function as follows:
```clojure
(def app-config (atom nil))

(defn init-config []
  (with-open
    [r (java.io.PushbackReader. (reader (load-config-file)))]
    (if-let [config (read r nil nil)]
      (reset! app-config config)))
  (println "servlet has been initialized"))
```
In our `log-stats` namespace the path to the logs is currently hard coded. Let's change it to read the path from our config file. We'll open our `resources/config` and add the following to it:
```clojure
{:log-path "logs/"}
```
Then in our `log-stats` namespace we'll change all references to "logs/" to (:log-path @app-config) instead:
```clojure
(ns my-website.views.log-stats
  ...
  (:use ... my-website.config))

(defpage [:post "/get-logs"] params  
  (response/json 
    (hits-per-second 
      (read-logs (last-log (:log-path @app-config))))))
```
To ensure that the application still runs correctly standalone we will have to call `init-config` in our `-main` in the `server` namespace:
```clojure
(ns my-website.server
  (:use my-website.config)
  ...)

(defn -main [& m]
  (let [mode (keyword (or (first m) :dev))
        port (Integer. (get (System/getenv) "PORT" "8080"))]
    (init-config)
    (server/start port {:mode mode
                        :ns 'my-website})))
```
Now the log path can be specified in the `config` file without having to rebuild and redeploy the application each time. Complete source for this section is available [here](https://github.com/yogthos/Noir-tutorial/commit/4b7d185b2aaa5e8af539344d9f1df677271ea44a).

