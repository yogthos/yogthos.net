{:title "Making services with Liberator",
 :layout :post,
 :tags ["clojure"]}

[Liberator](http://clojure-liberator.github.com/) is a recent Clojure library for writing RESTful services. Its primary feature is that it puts strong emphasis on decoupling the front end and the back end of the application.

Conceptually, Liberator provides a very clean way to reason about your service operations. Each request passes through a series of conditions and handlers defined in the resource. These map to the codes specified by the [HTTP rfc](http://www.ietf.org/rfc/rfc2616.txt), such as 200 - OK, 201 - created, 404 - not found, etc. This makes it very easy to write standards compliant services and to group the operations logically.

While the official site has some fairly decent documentation, I found there were a few areas where I had to dig around and look through the source to figure out what to do.

In this post I'll walk you through the steps to create a simple application which serves static resources, provides basic session management, and JSON operations.

Our application will be structures as follows:
```
src/liberator_service
         server.clj
         resources.clj
         static_resources.clj
         ui.clj
resources/public
         site.js
project.clj
```
Our `project.clj` will look as follows:
```clojure
(defproject liberator-example "0.1.0-SNAPSHOT"
  :description "Example for the Liberator library"
  :url "https://github.com/yogthos/liberator-example"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [compojure "1.0.2"]
                 [liberator "0.5.0"]
                 [sandbar "0.4.0-SNAPSHOT"]
                 [org.clojure/data.json "0.1.2"]
                 [ring/ring-jetty-adapter "1.1.0"]]
  :dev-dependencies [[lein-ring "0.7.3"]]
  :ring {:handler liberator-service.server/handler}
  :main liberator-service.server)
```
Now we'll take a look at the service namespace, in it we'll add the required libraries and create an atom to hold the session information.
```clojure
(ns liberator-service.server
  (:use [liberator.representation :only [wrap-convert-suffix-to-accept-header]]
        [ring.middleware.multipart-params :only [wrap-multipart-params]]
        ring.middleware.session.memory
        sandbar.stateful-session
        compojure.core 
        [compojure.handler :only [api]]
        liberator-service.ui
        liberator-service.resources
        liberator-service.static-resources)
  (:require
   [ring.adapter.jetty :as jetty]))

(defonce my-session (atom {}))
```
 Next we will define the routes which our application responds to. In our case we've defined routes for serving the home page, our services, and static content:
```clojure
(defn assemble-routes []
  (routes
    (GET   "/" [] home)
    (POST "/login" [] login)
    (POST "/logout" [] logout)
    (GET   "/resources/:resource" [resource] static)))
```
we'll also need to create a handler for the application:
```clojure
(defn create-handler []
  (fn [request]
    ((->
       (assemble-routes)
       api
       wrap-multipart-params
       (wrap-stateful-session {:store (memory-store my-session)})
       (wrap-convert-suffix-to-accept-header
         {".html" "text/html"
          ".txt" "text/plain"
          ".xhtml" "application/xhtml+xml"
          ".xml" "application/xml"
          ".json" "application/json"}))
      request)))
```
The session handling in our handler is provided by the `wrap-stateful-session` from the [sandbar](https://github.com/brentonashworth/sandbar) library. The `wrap-convert-suffix-to-accept-header` is used by the Liberator to decide what types of requests it will accept. Finally, we'll create a main to run our service:
```clojure
(defn start [options]
  (jetty/run-jetty
   (fn [request]
     ((create-handler) request))
   (assoc options :join? false)))

(defn -main
  ([port]
     (start {:port (Integer/parseInt port)}))
  ([]
     (-main "8000")))
```
Next let's write a resource which will display a login page:
```clojure
(ns liberator-service.ui
  (:use hiccup.page
        hiccup.element
        hiccup.form
        sandbar.stateful-session
        [liberator.core :only [defresource]]))

(defresource home
  :available-media-types ["text/html"]
  :available-charsets ["utf-8"]
  :handle-ok (html5 [:head (include-js
                             "http://ajax.googleapis.com/ajax/libs/jquery/1.8.0/jquery.min.js"
                             "/resources/site.js")]
                    [:body
                       [:div#message]
                       [:div#login
                        (text-field "user")
                        (password-field "pass")
                        [:button {:type "button" :onclick "login()"} "login"]]]))
```
Here we get a glimpse at how Liberator works. We use `defresource` to define the handler for the `home` route we specified earlier in our service. The resource specifies what media types it provides as well as the encoding for the content. If the handler is invoked successfully then the `:handle-ok` handler is called and its output is set as the body of the `response`.  In our `site.js` we'll define `login` and `logout` functions which will use POST to call login and logout operations on the server:
```javascript
function login() {
	$("#message").text("sending login request");
	$.post("/login", 
	       {user: $("#user").val(), pass: $("#pass").val()}, 
    	       function({window.location.reload(true);},
    	       "json")
         .error( function(xhr, textStatus, errorThrown) {       			 
      			 $("#message").text(textStatus + ": " + xhr.responseText);
   	 });
}

function logout() {
    $.post("/logout", 
           function() {window.location.reload(true);});					  	
}
```
Since we reference a local JavaScript file, we'll need to create a handler to serve it. We'll create a `static-resources` namespace for this purpose:
```clojure
(ns liberator-service.static-resources  
  (:use [liberator.core :only [defresource]]
        [ring.util.mime-type :only [ext-mime-type]])
  (:require [clojure.java.io :as io]))

(let [static-dir  (io/file "resources/public/")]
  (defresource static
    :available-media-types
    #(let [file (get-in % [:request :route-params :resource])]       
       (if-let [mime-type (ext-mime-type file)]
         [mime-type]
         []))

    :exists?
    #(let [file (get-in % [:request :route-params :resource])]       
       (let [f (io/file static-dir file)]
         [(.exists f) {::file f}]))
    
    :handle-ok (fn [{{{file :resource} :route-params} :request}]                 
                 (io/file static-dir file)))

    :last-modified (fn [{{{file :resource} :route-params} :request}]                                                               
                     (.lastModified (io/file static-dir file))))
```
When our home page requests `/resources/site.js`, this resource will set the mime type to "text/javascript" based on the extension of the file. It will check if the resource exists and the last modified time, and finally serve the resource in `:handle-ok` as needed.

Now let's create a resource which the client can call to login and create a session on the server. We'll put it in the `resources` namespace:
```clojure
(ns liberator-service.resources
  (:use clojure.data.json                        
        sandbar.stateful-session
        [liberator.core :only [defresource request-method-in]]))
```
For our testing, we'll simply create a dummy list of users and a helper to check if one matches our login params:
```clojure
(def users [{:user "foo" 
             :pass "bar"
             :firstname "John"
             :lastname "Doe"}])

(defn valid-user [user]
  (some #(= user (select-keys % [:user :pass])) users))
```
and now we'll create the login resource itself:
```clojure
(defresource login
  :available-media-types ["application/json" "text/javascript"]
  :method-allowed? (request-method-in :post)  
  :authorized?     (fn [{{user :params} :request}]                 
                     (or (session-get :user) (valid-user user)))
  
  :post! (fn [{{{:keys [user]} :params} :request :as ctx}]
           (session-put! :user user))
  
  :handle-unauthorized (fn [ctx] (:message ctx))  
  :handle-created      (json-str {:message "login successful"}))
```
Again, the above is fairly straight forward. We specify the media types the handler responds to,  set it to allow the POST request type , check if the supplied user params are valid, and either create the user or return an error based on whether the `:authorized?` handler succeeds.

As I mentioned above, each handler responds to a specific HTTP code. For example, if `:authorized?` returns false then the code will be set to 401, which will cause `:handle-unauthorized` handler to be invoked. If `:authorized?` it true then the `:post!` handler gets called, and if it succeeds then subsequently`:handle-created`. Next we need a logout resource, and it looks as follows:
```clojure
(defresource logout
  :available-media-types ["application/json" "text/javascript"]
  :method-allowed? (request-method-in :post)  
  :post!           (session-delete-key! :user)
  :handle-created  (json-str {:message "logout successful"}))
```
You might have noticed that Liberator is pretty flexible regarding what you can supply as the handler. It can either be a callable function, an evaluated expression, or a value.

Now that we have a way for the user to login and logout, let's revisit our UI handler and update it to render different content based on whether there is a user in the session:
```clojure
(ns liberator-service.ui
  (:use hiccup.page
        hiccup.element
        hiccup.form
        sandbar.stateful-session
        liberator-service.resources
        [liberator.core :only [defresource]]))

(defn get-user []
  (first (filter #(= (session-get :user) (get-in % [:user])) users)))

(def login-page 
  [:body
   [:div#message]
   [:div#login
    (text-field "user")
    (password-field "pass")
    [:button {:type "button" :onclick "login()"} "login"]]])

(defn home-page [] 
  [:body
   (let [{firstname :firstname lastname :lastname} (get-user)] 
     [:div#message (str "Welcome " firstname " " lastname)])
   [:div#logout 
    [:button {:type "button" :onclick "logout()"} "logout"]]])

(defresource home
  :available-media-types ["text/html"]
  :available-charsets ["utf-8"]
  :handle-ok (html5 [:head (include-js
                             "http://ajax.googleapis.com/ajax/libs/jquery/1.8.0/jquery.min.js"
                             "/resources/site.js")]
                    (if (session-get :user) (home-page) login-page)))
```
That's all there is to it. We have a page which checks if there is a user in the session, if there is then it dsiplays the content of the `home-page` and if not then the `login-page` content is displayed. The page interacts with the service by calling `login` and `logout` resources via Ajax.

Complete source for the example is available [here](https://github.com/yogthos/liberator-example). 

Overall, I definitely think that Liberator makes writing RESTful applications easy and natural. This is a fairly different approach from [Noir](http://www.webnoir.org/), where you think in terms of pages and simply implement the UI and the backend portion for each one. 

While the Noir approach can easily result in tight coupling between the UI and the backend, the Liberator ensures that we're always thinking in terms of service operations whenever any interaction between the service and the client is happening.


