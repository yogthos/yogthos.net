{:title "Macchiato: ClojureScript Arrives on the Server"
 :layout :post
 :tags ["clojurescript" "node"]}
 
 I recently started the [Macchiato](https://github.com/macchiato-framework) project to provide a platform for building ClojureScript based apps on top Node.js.
  
First, let's look at some of the reasons for running ClojureScript on the server. The JVM is an excellent platform, it's mature, performant, and has a large ecosystem around it. This makes it a solid choice for a wide range of applications.

However, there are situations where the JVM might not be a good fit. It's a complex piece of technology that requires experience to use effectively. It has a fairly large footprint even from small applications. The startup times can be problematic, especially when it comes to loading Clojure runtime.

Meanwhile, Node.js also happens to be a popular platform with a large ecosystem around it. It requires far less resources for certain types of applications, has very fast startup times, and its ecosystem is familiar to many JavaScript developers.

Another appeal for Node based servers comes from building full stack ClojureScript single-page applications, since using Node on the server facilitates server-side rendering for any React based libraries.

While there are a few existing experiments using ClojureScript on Node, such as [Dog Fort](https://github.com/whamtet/dogfort), none of these appear to be actively maintained. Since ClojureScript and its ecosystem have evolved in the meantime, I wanted to create a fresh stack using the latest tools and best practices.

### Overview

My goal for Macchiato is to provide a stack modeled on Ring based around the existing Node ecosystem, and a development environment similar to what's available for Clojure on the JVM.

#### The Stack

I think it makes sense to embrace the Node ecosystem and leverage the existing modules whenever possible. For example, Ring style cookies map directly to the [cookies](https://www.npmjs.com/package/cookies) NPM module. Conversely, there are a number of excellent ClojureScript libraries available as well, such as [Timbre](https://github.com/ptaoussanis/timbre),
 [Bidi](https://github.com/juxt/bidi/), and [Mount](https://github.com/tolitius/mount).

I used a Ring inspired model where I created [wrappers around Node HTTP request and response objects](https://github.com/macchiato-framework/macchiato-http/blob/master/src/macchiato/http.cljs). This allowed adapting parts of Ring, such as its session store implementation, with minimal changes.

The `ClientRequest` object is translated to a Clojure map, and the response map is written to the `ServerResponse` object. The request handler is implemented as follows:

```clojure
(defprotocol IHTTPResponseWriter
  (-write-response [data res] "Write data to a http.ServerResponse"))

(defn response [req res opts]
  (fn [{:keys [cookies headers body status]}]
    (cookies/set-cookies cookies req res (:cookies opts))
    (.writeHead res status (clj->js headers))
    (when (-write-response body res)
      (.end res))))

(defn handler [handler-fn & [opts]]
  (let [opts (or opts {})]
    (fn [req res]
      (handler-fn (req->map req res opts) (response req res opts)))))
```

The `handler` accepts a `handler-fn` function that's passed the request map produced by the `req->map` helper. The `handler-fn` is expected to return a request handler function that will be used to generate the response. This function should accept the request map and the `response` call back function that writes the response map to the `ServerResponse` object. The `IHTTPResponseWriter` protocol is used to serialize different kinds of responses.

#### Concurrent Request Handling

JVM servers commonly use a listener thread for accepting client requests, the connections are then passed on to a thread pool of request handlers. This allows the listener to continue accepting connections while the requests are being processed.

Since Node is single threaded, long running request handlers block the server until they finish. While async operations can be used to handle IO in the background, any business logic will end up preventing the server from accepting new connections while it's running.

One way around this is to use the cluster module that spins up a single listening process that forks child processes and dispatches the requests to them. Setting this up is pretty straight forward: 

```clojure
(defstate env :start (config/env))
(defstate http :start (js/require "http"))

(defn app []
  (mount/start)
  (let [host (or (:host env) "127.0.0.1")
        port (or (js/parseInt (:port env)) 3000)]
    (-> @http
        (.createServer
          (handler
            router
            {:cookies {:signed? true}
             :session {:store (mem/memory-store)}}))
        (.listen port host #(info "app started on" host ":" port)))))

(defn start-workers [os cluster]
  (dotimes [_ (-> os .cpus .-length)]
    (.fork cluster))
  (.on cluster "exit"
       (fn [worker code signal]
         (info "worker terminated" (-> worker .-process .-pid)))))

(defn main [& args]
  (let [os      (js/require "os")
        cluster (js/require "cluster")]
    (if (.-isMaster cluster)
      (start-workers os cluster)
      (app))))
```

However, it's worth noting that unlike threads, processes don't share memory. So, each child that gets spun up will require its own copy of the memory space.

#### The Template

I setup a [template](https://github.com/macchiato-framework/macchiato-template) that creates a minimal app with some reasonable defaults. This template is published to Clojars, and you can try it out yourself by running:

```
lein new macchiato myapp
```

The template is setup similarly to Luminus. The source code for the project is found in the `src` folder, and the `env` folder contains code that's specific for dev and prod environments.

The `project.clj` contains `dev` and `release` profiles for working with the app in development mode and packaging it for production use. The app can be started in development mode by running:

```
lein build
```

This will clean the project, download NPM modules, and start the Figwheel compiler. Once Figwheel compiles the sources, you can run the app with Node in another terminal as follows:

```
node target/out/myapp.js
```

The app should now be available at `http://localhost:3000`.


Figwheel also starts the nREPL at `localhost:7000`. You can connect to it from the editor and run `(cljs)` to load the ClojureScript REPL.

Packaging the app for production is accomplished by running:

```
lein package
```

This will print out `package.json` for the app and generate the release artifact called `target/release/myapp.js`.

### Looking Forward

Overall, I think that ClojureScript on top of Node is ready for prime time. It opens up server-side Clojure development to a large community of JavaScript developers, and extends the reach of Clojure to any platform that supports Node.

While the initial results are very promising, there is still much work to be done in order to provide a solid stack such as Luminus. If you think this project is interesting, feel free to ping me via email or on the Clojurians slack. I would love to collaborate on making Macchiato into a solid choice for developing Node based applications.
