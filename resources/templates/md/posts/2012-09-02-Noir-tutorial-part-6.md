{:title "Noir tutorial - part 6",
 :layout :post,
 :tags ["noir" "clojure"]}

In the [first part](https://www.yogthos.net/blog/22) of the tutorial we've already seen how to run our application in standalone mode.  Here we will look at what we need to do to deploy it on an application server such as [Glassfish](http://glassfish.java.net/), [Tomcat](http://tomcat.apache.org/), [jBoss](http://www.jboss.org/), or [Immutant](http://immutant.org/) which is a modification of jBoss geared specifically towards Clojure.

There are numerous reasons as to why you might want to do this. For example, an application server lets you run multiple applications at the same time. Another advantage is that the application server can take care of the configuration details, such as handling database connections. 

When building real world applications, you will likely have separate dev/staging/prod configurations. Instead of having different builds for our application, we can instead configure our application servers appropriately for each environment. Then we can have a single build process which is much less error prone in my opinion. We can also configure CI, such as [Jenkins](http://jenkins-ci.org/) to build our application and automatically deploy it to the server ensuring that we always have the latest code running.

Finally, if you plan on using a hosting provider, you may end up deploying on a shared application server as opposed to being able to run your application standalone. 

Let's go over the prerequisites for building our application into a WAR and deploying it to a server. You will need to setup an application server of your choice for this section. I will be using Tomcat, but the steps will be similar for other servers as well. If you will be using Tomcat, then download the [latest version](http://apache.mirror.nexicom.net/tomcat/tomcat-7/v7.0.29/bin/apache-tomcat-7.0.29.zip). To start up the server you simply unpack the archive, navigate to the resulting directory, and run:
```bash
chmod +x bin/catalina.sh
bin/catalina.sh start
Using CATALINA_BASE:   apache-tomcat-7.0.29
Using CATALINA_HOME:   apache-tomcat-7.0.29
Using CATALINA_TMPDIR: apache-tomcat-7.0.29/temp
Using JRE_HOME:        /Library/Java/Home
Using CLASSPATH:       apache-tomcat-7.0.29/bin/bootstrap.jar:apache-tomcat-7.0.29/bin/tomcat-juli.jar
```
Your Tomcat should now be up and running and you can test it by navigating to [localhost:8080](http://localhost:8080):
<center>![tomcat](/files/tomcat.png)</center>
With the application server running, let's prepare our application for deployment. First, we must ensure that the `server` namespace requires all the namespaces in our views package, and has the `gen-class` directive specified:
```clojure
(ns my-website.server
  (:require [noir.server :as server]
            [my-website.views 
             common
             files
             log-stats
             users
             welcome])     
  (:gen-class))
```
This will ensure that the server and the views are compiled during the build step, which is needed for them to be picked up by the application server when the application is deployed. Next, we will change `server/load-views` call to `server/load-vews-ns`:
```clojure
(server/load-views-ns 'my-website.views)
```
If you used Leiningen 2 to create the project template, then `load-views-ns` should already be set correctly.

Finally, we have to add a handler which will be used instead of the `-main` when running on the application server:
```clojure
(def base-handler 
  (server/gen-handler 
    {:mode :prod, 
     :ns 'my-website 
     :session-cookie-attrs {:max-age 1800000}}))
```
It is possible to chain different handlers together. In our case, we will need a wrapper for our handler to prepend the servlet context to all the requests coming to our servlet. This is a workaround for a [bug](https://github.com/noir-clojure/noir/issues/120) in the current version of Noir, which ignores it. Without this fix none of the redirects will work correctly as they will be routed to the base application server URL instead.

Each wrapper is a function which accepts the current handler, and returns a function which accepts a request, does something to it, and then return the result of calling  the handler on it. The result is in turn a handler itself, so we can chain as many wrappers together as we like. In our case we will override the `resolve-url` function in `noir.options` with one of our own making:
```clojure
(defn fix-base-url [handler]
  (fn [request]    
    (with-redefs [noir.options/resolve-url 
                  (fn [url]                    
                    ;prepend context to the relative URLs
                    (if (.contains url "://") 
                      url (str (:context request) url)))]
      (handler request))))
```
Above, we will check that the URL contains "://", if not then we treat it as a local URL and prepend the servlet context to it. Now we have to hook it up with our initial handler to produce the final request handler for our servlet:
```clojure
(def handler (-> base-handler fix-base-url))
```
Now that we've created our handler, we need to point our `project.clj` to it:
```clojure
(defproject my-website "0.1.0-SNAPSHOT"
            :description "my Noir website"
            :dependencies [[org.clojure/clojure "1.4.0"]
                           [noir "1.3.0-beta3"]
                           [org.clojure/java.jdbc "0.2.3"]
                           [postgresql/postgresql "9.1-901.jdbc4"]]
            :dev-dependencies [[lein-ring "0.7.3"]]
            :ring {:handler my-website.server/handler}
            :main my-website.server)
```
We've also added `lein-ring` plugin to our `dev-dependencies`, this is required for generating the WAR artifact from our build. Under the `:ring` key we set the `:handler` to the one we defined above.

Let's test that our project builds correctly and produces a working WAR by running the following commands from the temrinal:
```bash
lein deps
Copying 29 files to Noir-tutorial/lib
[INFO] snapshot thneed:thneed:1.0.0-SNAPSHOT: checking for updates from clojars
[INFO] snapshot thneed:thneed:1.0.0-SNAPSHOT: checking for updates from central
Copying 5 files to Noir-tutorial/lib/dev

lein ring uberwar
Compiling my-website.server
Compilation succeeded.
Created Noir-tutorial/my-website-0.1.0-SNAPSHOT-standalone.war
```
If we have our application server running, then we should be able to simply drop this WAR in its deployment folder and the server will take care of the rest. If we're using Tomcat, then we have to copy it to the `webapps` folder:
```bash
cp my-website-0.1.0-SNAPSHOT-standalone.war ../apache-tomcat-7/webapps/my-website.war
```
Make sure to replace the `../apache-tomcat-7` above with the location of your Tomcat server. We can now take a look at our server log and see that the application was deployed successfully:
```bash
tail -f logs/catalina.out
...
INFO: Deploying web application archive apache-tomcat-7.0.29/webapps/my-website.war
```
Now let's navigate to [localhost:8080/my-website](http://localhost:8080/my-website) and we should see our application running:
<center>![website](/files/website-on-tomcat.png)</center>

One last thing to note is that any Ajax calls in our pages will have to use the servlet context to be resolved correctly. A workaround for this issue is to use `noir.request/ring-request` to check if a context is present and set it as a hidden field on the page:
```clojure
(ns my-website.views.log-stats
  (:require [my-website.views.common :as common]
            [noir.request :as request]
            [noir.response :as response])
  (:use clojure.java.io hiccup.page hiccup.form noir.core)
  (:import java.text.SimpleDateFormat))

(defpage "/access-chart" []
  (common/basic-layout
    (include-js "/js/site.js")
    (hidden-field "context" (:context (request/ring-request)))
    [:div#hits-by-time "loading..."]))
```
Then we can check this value and prepend it to the URL when making our Ajax query:
```javascript
$(document).ready(function(){	
    var context = $('#context').val();
    var url = '/get-logs';
    if (context) url = context + url;
    var options = {xaxis: { mode: "time", 
                            minTickSize: [1, "minute"]}};
	$.post(url, function(data){
	    $.plot($("#hits-by-time"), [data], options);
	    });		
});
```

As usual, the complete code for this section is available [here](https://github.com/yogthos/Noir-tutorial/tree/e5964216fd009239d1494c7cfcb7888f4f6b374d).
