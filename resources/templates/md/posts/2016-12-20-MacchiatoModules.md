{:title "Macchiato Modules"
 :layout :post
 :tags ["clojurescript" "macchiato" "node"]}
 
As I discussed in the last [post](http://yogthos.net/posts/2016-12-17-MacchiatoProgress.html), Ring middleware stack closely resembles modules in a framework. However, one notable difference is that middleware functions aren't directly aware of one another. When the handler is passed to a middleware function, that function has no way of knowing what other middleware might have been wrapped around the handler by the time it got to it.

Conversely, these functions can't know what middleware will be wrapped after that they may depend on. Since middleware that was wrapped last will be invoked first, inner middleware ends up being dependent on the outer middleware.

This presents a number of problems. We can end up with multiple copies of the same middleware wrapped around the handler, middleware could be wrapped in the wrong order, or required middleware might be missing altogether. All of the above cases can lead to unpredictable behaviors, and can be difficult to debug.

One way to mitigate the problem is by creating a default middleware stack, such as seen in the [ring-defaults](https://github.com/ring-clojure/ring-defaults) library. This takes care of ensuring that all the core middleware is wrapped correctly, but doesn't help with middleware libraries added by the user. Another approach is to wrap the Ring stack in a higher level abstraction as seen with [Integrant](https://github.com/weavejester/integrant).

The solution I came up with for Macchiato is to use metadata attached to the handler to track the middleware that's been applied to it. This metadata can be used to inform how the middleware is loaded, and address the problems outlined above.

Let's take a look at an example of how this works in practice. Let's say we have the default handler such as:

```clojure
(defn handler [req res raise]
  (res {:body (str (-> req :params :name))}))
```

Then, let's say we have two pieces of middleware we wish to wrap the handler with. The first will parse the request params, and the second will keywordize the params. The second middleware function depends on the first in order to work.

```clojure
(defn parse-params [req]
  ;;parses request parameters into a map
  )

(defn wrap-params [handler]
  (fn [req res raise]
    (handler (parse-params req) res raise)))

(defn keywordize-params [params]
  ;;keywordizes the params
  )
          
(defn wrap-keyword-params [handler]
  (fn [req res raise]
    (handler (update req :params keywordize-params) res raise)))
```

We have to make sure that the middleware is chained as follows to get keywordized params:

```clojure
(def wrapped-handler (-> handler
                         wrap-keyword-params
                         wrap-params))
```

However, it's not possible to deduce that this actually happened given the resulting handler function. Let's see how we can use metadata to address this problem. We'll update the `wrap-params` and the `wrap-keyword-params` functions as follows:

```clojure
(defn
  ^{:macchiato/middleware
    {:id :wrap-params}}    
  wrap-params [handler]
  (fn [req res raise]
    (handler (parse-params req) res raise)))

(defn
 ^{:macchiato/middleware
   {:id :wrap-keyword-params
    :required [:wrap-params]}}
  wrap-keyword-params [handler]
  (fn [req res raise]
    (handler (update req :params keywordize-params) res raise)))
```

The `:id` key in the metadata is meant to specify the specific type of middleware as opposed to a concrete implementation. If two pieces of middleware happen to implement the same functionality they should use the same `:id`. 

The `:required` key specifies the keys for the `:id`s that the particular middleware function depends on. In this case, `wrap-keyword-params` requires `wrap-params` to be present.

Next, we can write the code that will update the handler metadata each time it's wrapped with a middleware function.

```clojure
(defn update-middleware-meta [handler handler-middleware middleware-meta]
  (with-meta
    handler
    {:macchiato/middleware
     (conj handler-middleware middleware-meta)}))

(defn loaded? [middleware {:keys [id]}]
  (some #{id} (map :id middleware)))

(defn- middleware-from-handler [handler]
  (->> handler meta :macchiato/middleware (remove nil?) vec))

(defn wrap
  ([handler middleware-fn]
   (wrap handler middleware-fn nil))
  ([handler middleware-fn opts]
   (let [handler-middleware (middleware-from-handler handler)
         middleware-meta    (-> middleware-fn meta :macchiato/middleware)]
     (if (loaded? handler-middleware middleware-meta)
       handler
       (update-middleware-meta
         (if opts
           (middleware-fn handler opts)
           (middleware-fn handler))
         handler-middleware
         middleware-meta)))))
```

The `wrap` function uses the `:macchiato/middleware` metadata key to get the currently applied middleware. When a middleware function with the same `:id` is already present, then the original handler is returned. Otherwise, the handler is wrapped with the middleware and its metadata is updated.

Let's update the original code that wrapped the handler to use the `wrap` function:

```clojure
(def wrapped-handler (-> handler
                         (wrap #'wrap-keyword-params)
                         (wrap #'wrap-params)))
```

We can now use the `meta` function to access the metadata that was generated for the handler:

```clojure
(meta wrapped-handler)

{:macchiato/middleware
 [{:id :wrap-params}
  {:id :wrap-keyword-params
   :required [:wrap-params]}]}
```

This tells us exactly what middleware has been applied to the handler and in what order, allowing us to validate that the middleware chain. This is accomplished as follows:

```clojure
(defn validate [handler-middleware
   {:keys [id required] :as middleware-meta}]
  (when (not-empty (difference (set required)
                               (set (map :id handler-middleware))))
    (throw (js/Error. (str id " is missing required middleware: " required))))
  middleware-meta)
  
(defn validate-handler [handler]
  (let [middleware (middleware-from-handler handler)]
    (loop [[middleware-meta & handler-middleware] middleware]
      (when middleware-meta
        (validate handler-middleware middleware-meta)
        (recur handler-middleware)))
    handler))  
```

With the above code in place we're now able to ensure that middleware functions are not loaded more than once, and that the order of middleware is correct.

Finally, Macchiato provides the `macchiato.middleware/wrap-middleware` convenience function that allows wrapping multiple middleware functions around the handler:

```clojure
(m/wrap-middleware
  handler
  #'wrap-anti-forgery
  [#'wrap-session {:store (mem/memory-store)}]
  #'wrap-nested-params
  #'wrap-keyword-params
  #'wrap-params)
```

I think that the approach of using metadata provides an elegant view into the state of the middleware chain, while allowing Macchiato to stay compliant with Ring middleware semantics.

Another advantage of using metadata is that it makes the mechanism user extensible. If you're using a piece of middleware that doesn't have the metadata you need, you can always set it yourself.

The latest release of Macchiato has all the core middleware tagged with the appropriate metadata, and [macchiato-defaults](https://github.com/macchiato-framework/macchiato-defaults) generates a handler that has the `:macchiato/middleware` key that contains the vector of the middleware that was applied.