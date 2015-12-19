{:title "Introducing cljs-ajax",
 :layout :post,
 :tags ["clojure" "clojurescript" "luminus"]}

I recently started working on a project using ClojureScript and it's turning out to be a really good experience so far. I've been using [Domina](https://github.com/levand/domina) and [Dommy](https://github.com/Prismatic/dommy) for DOM manipulation and templating. Both libraries are very easy to use and provide all  the functionality needed for common operations.

Surprisingly, I didn't find any up to date libraries for handling Ajax. The only one I could find is [fetch](https://github.com/ibdknox/fetch). Unfortunately, it depends on Noir which is no longer maintained.

I ended up writing a wrapper for `goog.net.XhrIo` called [cljs-ajax](https://github.com/yogthos/cljs-ajax). It provides an API similar to [clj-http](https://github.com/dakrone/clj-http) and handles all the nitty gritty details for you.

Currently, the API provides `ajax-request`, `GET`, and `PUT` functions. The `ajax-request` function accepts the following parameters:

* `uri` - the URI for the request
* `method` - a string representing the HTTP request type, eg: "PUT", "DELETE", etc.
* `format` - a keyword indicating the response format, can be either `:json` or `:edn`, defaults to `:edn`
* `handler` - success handler, a function that accepts the response as a single argument
* `error-handler` - error handler, a function that accepts a map representing the error with keys `:status` and `:status-text`
* `params` - a map of params to be sent to the server

The `GET` and `POST` are helper functions that accept a URI followed by a map of options containing any of the following keys:

* `:handler` - the handler function for successful operation should accept a single parameter which is the deserialized response
* `:error-handler` - the handler function for errors, should accept a map with keys `:status` and `:status-text`
* `:format` - the format for the response `:edn` or `:json` defaults to `:edn`
* `:params` - a map of parameters that will be sent with the request

Here's some example usage:

```clojure
(ns foo
 (:require [ajax.core :refer [GET POST]]))

(defn handler [response]
 (.log js/console (str response)))

(defn error-handler [{:keys [status status-text]}]
 (.log js/console 
  (str "something bad happened: " status " " status-text)))

(GET "/hello")

(GET "/hello" {:handler handler
               :error-handler error-handler})

(POST "/hello")

(POST "/send-message" 
      {:params {:message "Hello World"
                :user    "Bob"}
      :handler handler
      :error-handler error-handler})

(POST "/send-message" 
      {:params {:message "Hello World"
                :user    "Bob"}
      :handler handler
      :format :json
      :error-handler error-handler})
```

The latest version of Luminus comes packaged with a ClojureScript example when the `+cljs` option is selected. Let's create a new project called `ajax-example` and take a look at how it works:

```
lein new luminus ajax-example +cljs
```

The `project.clj` will contain the dependencies for Domina, Dommy, and cljs-ajax as well as a `cljsbuild` configuration. The current version of cljsbuild references an old version of ClojureScript, so the latest version is also explicitly included as a dependency.

In order to use the ClojureScript from our page we'll first need to compile it. This is done by running `lein cljsbuild once`. The resulting artifact will be placed under `resources/public/js/site.js` as specified in the cljsbuild section of the project.

You'll notice that the build takes a while to run. Luckily, if we run it using `lein cljsbuild auto` it will run much faster and any time we make changes to any of the ClojureScript namespaces they will trigger an incremental build.

Working with the auto build running is nearly as seamless as working with plain old JavaScript. You make a change in the source, save, and reload the page. The compilation step tends to take under a second, so the intermediate delay is barely noticeable.

Our project has a source directory called `src-cljs` where ClojureScript namespaces live. It contains a file called `main.cljs`. This example illustrates using GET and POST calls to interact with the server as well as rendering DOM elements. Let's take a look inside it:

```clojure
(ns cljs-test.main
 (:require [ajax.core :refer [GET POST]]
           [domina :refer [value by-id destroy-children! append!]]
           [domina.events :refer [listen!]]
           [dommy.template :as template]))

(defn render-message [{:keys [message user]}]
 [:li [:p {:id user} message " - " user]])

(defn render-messages [messages]
 (let [messages-div (by-id "messages")]
   (destroy-children! messages-div)
   (->> messages
        (map render-message)
        (into [:ul])
        template/node
        (append! messages-div))))

(defn add-message [_]
 (POST "/add-message"
       {:params {:message (value (by-id "message"))
                 :user    (value (by-id "user"))}
        :handler render-messages}))

(defn ^:export init []
 (GET "/messages" {:handler render-messages})
 (listen! (by-id "send")
          :click add-message))
```

Here, we have a couple of functions to render the messages we receive from the server. The `render-message` function accepts a map with the keys message and user and creates a list item. The `render-messages` will create a list from the messages and render it using `template/node` function. The rendered messages will be appended to the div with the id `messages` using the `append!` function.

Next, we have a function to add a a new message. It grabs the values from elements selected by their ids and sends them as params named message and user. The server responds with a list of current messages. So we use `render-messages` as the response handler.

In our `init` function, we send a GET request to grab the current messages, then we bind the `add-message` function to the button with the id `send`.

On the server side we have a `ajax-example.routes.cljsexample` namespace. It provides the routes to render the page and handle the `/messages` and `/add-message` operations.

```clojure
(ns ajax-example.routes.cljsexample
 (:require [compojure.core :refer :all]
           [noir.response :as response]
           [ajax-example.views.layout :as layout]))

(def messages
 (atom
   [{:message "Hello world"
     :user    "Foo"}
    {:message "Ajax is fun"
     :user    "Bar"}]))

(defroutes cljs-routes
 (GET "/cljsexample" [] (layout/render "cljsexample.html"))
 (GET "/messages" [] (response/edn @messages))
 (POST "/add-message" [message user]
       (response/edn
         (swap! messages conj {:message message :user user}))))
```

As you can see, the routes simply return EDN responses to the client. Finally, we have the template for the actual example page, that looks as follows:

```xml
{% extends "cljs_test/views/templates/base.html" %}


{% block content %}

<br/>
<div id="messages"></div>
<textarea id="message"></textarea>
<br/>
<input type="text" id="user"></input>
<br/>
<button id="send">add message</button>

<!--  scripts -->
<script type="text/javascript" src="js/site.js"></script>
<script type="text/javascript">
	cljs_test.main.init();
</script>

{% endblock %}
```

The page references the `site.js` script that will be output by the compiler and calls the `init` function that we saw above.

Overall, I feel that ClojureScript is rapidly becoming a viable alternative to using JavaScript on the client. There are still some rough edges, but most things work out of the box and you get many of the same benefits associated with using Clojure on the server.
