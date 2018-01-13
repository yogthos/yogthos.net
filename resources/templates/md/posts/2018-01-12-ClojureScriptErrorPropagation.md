{:title "Capturing ClojureScript Errors on the Server", :layout :post, :tags ["clojure" "clojurescript"]}

Logging errors is an important aspect of writing real-world applications. When something goes wrong at runtime it's very helpful to have a log detailing what went wrong in order to fix the problem. This is a straightforward process when we're working on the backend code. We can catch the exception and log it along with the stack trace. However, we need to get a bit more creative in order to handle client-side errors.

In this post we'll take a look at propagating errors from a [Reagent](http://reagent-project.github.io/) based app back to the server. A naive implementation might look something like the following. We'll write a function that accepts an event containing the error, then send the error message along with the stack trace to the server:

```clojure
(defn report-error! [event]
  (let [error (.-error event)
        message (.-message error)
        stacktrace (.-stack error)]    
    (ajax/POST "/error"
               {:headers
                {"x-csrf-token"
                 (.-value (js/document.getElementById "__anti-forgery-token"))}
                :params
                {:message     message
                 :stacktrace stacktrace}})))
```

Next, we'll set the `report-error!` function as the global `error` event listener:

```clojure
(defn init! []
  (.addEventListener js/window "error" report-error!)
  (reagent/render [home-page] (.getElementById js/document "app")))
```

The `home-page` function will render a button that will throw an error when it's clicked:

```clojure
(defn home-page []
  [:div>h2 "Error Test"
   [:div>button
    {:on-click #(throw (js/Error. "I'm an error"))}
    "throw an error"]])
```

If we pop up the console in the browser we should see something like the following there:

```
Uncaught Error: I'm an error
    at app.core.home_page (core.cljs:25)
    at Object.ReactErrorUtils.invokeGuardedCallback (react-dom.inc.js:9073)
    at executeDispatch (react-dom.inc.js:3031)
    at Object.executeDispatchesInOrder (react-dom.inc.js:3054)
    at executeDispatchesAndRelease (react-dom.inc.js:2456)
    at executeDispatchesAndReleaseTopLevel (react-dom.inc.js:2467)
    at Array.forEach (<anonymous>)
    at forEachAccumulated (react-dom.inc.js:15515)
    at Object.processEventQueue (react-dom.inc.js:2670)
    at runEventQueueInBatch (react-dom.inc.js:9097)
```

This gives us the namespace and the line number in the ClojureScript source that caused the error. However, if we print the message that we received on the server it will look as follows:

```
 Error: I'm an error
    at app.core.home_page (http://localhost:3000/js/out/app/core.js:51:8)
    at Object.ReactErrorUtils.invokeGuardedCallback (http://localhost:3000/js/out/cljsjs/react-dom/development/react-dom.inc.js:9073:16)
    at executeDispatch (http://localhost:3000/js/out/cljsjs/react-dom/development/react-dom.inc.js:3031:21)
    at Object.executeDispatchesInOrder (http://localhost:3000/js/out/cljsjs/react-dom/development/react-dom.inc.js:3054:5)
    at executeDispatchesAndRelease (http://localhost:3000/js/out/cljsjs/react-dom/development/react-dom.inc.js:2456:22)
    at executeDispatchesAndReleaseTopLevel (http://localhost:3000/js/out/cljsjs/react-dom/development/react-dom.inc.js:2467:10)
    at Array.forEach (<anonymous>)
    at forEachAccumulated (http://localhost:3000/js/out/cljsjs/react-dom/development/react-dom.inc.js:15515:9)
    at Object.processEventQueue (http://localhost:3000/js/out/cljsjs/react-dom/development/react-dom.inc.js:2670:7)
    at runEventQueueInBatch (http://localhost:3000/js/out/cljsjs/react-dom/development/react-dom.inc.js:9097:18)
```

The stack trace is there, but it's no longer source mapped. So we'll know what namespace caused the error, but not the line in question. In order to get a source mapped stack trace we'll have to use a library such as [stacktrace.js](https://github.com/stacktracejs/stacktrace.js). Unfortunately, we won't be able to use the new `:npm-deps` option in the ClojureScript compiler. This works as expected when `:optimizations` are set to `:none`, but fails to provide us with the source mapped stack trace in the `:advanced` mode.

Instead, we'll use the [WebJars](https://www.webjars.org/) dependency along with the [ring-webjars](https://github.com/weavejester/ring-webjars) middleware:

```clojure
:dependencies
[...
 [ring-webjars "0.2.0"]
 [org.webjars.bower/stacktrace-js "2.0.0"]]
```

The middleware uses the `/assets/<webjar>/<asset path>` pattern to load the resources packaged in WebJars dependencies. Here's how this would look for loading the stacktrace-js resource. 

We'll require the middleware:
 
```clojure
(ns app.handler
 (:require
  ...
  [ring.middleware.webjars :refer [wrap-webjars]]))
```
  
Wrap the Ring handler with it:
 
```clojure
 (defn -main []
  (run-jetty
   (-> handler
       (wrap-webjars)
       (wrap-defaults site-defaults))
   {:port 3000 :join? false}))
```

The `stacktrace.min.js` file packaged in the `org.webjars.bower/stacktrace-js` dependency will be available as a resource at the following path `/assets/stacktrace-js/dist/stacktrace.min.js`:

```clojure
(defroutes handler
  (GET "/" []
    (html5
      [:head
       [:meta {:charset "utf-8"}]
       (anti-forgery-field)]
      [:body
       [:div#app]
        (include-js "/assets/stacktrace-js/dist/stacktrace.min.js"
                    "/js/app.js")]))
  
  (POST "/error" {:keys [body]}
    (let [{:keys [message stacktrace]}
          (-> body
              (transit/reader :json)
              (transit/read))]
      (println "Client error:" message "\n" stacktrace))
    "ok")
  
  (resources "/")
  (not-found "Not Found"))
```
   
Finally, the ClojureScript compiler configuration will look as follows:
 
 
```clojure
{:output-dir "target/cljsbuild/public/js"
 :output-to  "target/cljsbuild/public/js/app.js"
 :source-map "target/cljsbuild/public/js/app.js.map"
 :optimizations :advanced
 :infer-externs true
 :closure-warnings {:externs-validation :off
                    :non-standard-jsdoc :off}}
```

We need to specify the name of the source map file when using the advanced optimization, tell the compiler to infer the externs, and optionally suppress the warnings.

The new version of the `report-error!` function will look similar to the original, except that we'll now be passing the error to the `StackTrace.fromError` function. This function returns a promise containing the source mapped stack trace that we'll be sending to the server:

```clojure 
(defn report-error! [event]
  (let [error (.-error event)]
    (-> (js/StackTrace.fromError error)
        (.then
         (fn [stacktrace]
           (ajax/POST "/error"
                      {:headers
                       {"x-csrf-token"
                        (.-value (js/document.getElementById "__anti-forgery-token"))}
                       :params
                       {:message    (.-message error)
                        :stacktrace (->> stacktrace
                                          (mapv #(.toString %))
                                          (string/join "\n "))}}))))))
```
 
This time around we should see the source mapped error on the server with all the information that we need:

```
I'm an error
 Error()@http://localhost:3000/js/app/core.cljs:27:23
 mountComponent()@http://localhost:3000/js/app.js:40:5631
 focusDOMComponent()@http://localhost:3000/js/app.js:38:22373
 focusDOMComponent()@http://localhost:3000/js/app.js:38:22588
 focusDOMComponent()@http://localhost:3000/js/app.js:38:18970
 focusDOMComponent()@http://localhost:3000/js/app.js:38:19096
 didPutListener()@http://localhost:3000/js/app.js:41:12120
 focusDOMComponent()@http://localhost:3000/js/app.js:38:20154
 mountComponent()@http://localhost:3000/js/app.js:40:5880
```

We can see that the error occurred on line 27 of the `app.core` namespace which is indeed where the code that throws the exception resides. The full listing for the example is available on [GitHub](https://github.com/yogthos/clojurescript-error-reporting-example).

While the example in this post illustrates bare bones exception handling, we can do more interesting things in a real world application. For example, [re-frame](https://github.com/Day8/re-frame) based application could send the entire state of the re-frame database at the time of the error to the server. This allows us to put the application in the exact state that caused the error when debugging the problem.
