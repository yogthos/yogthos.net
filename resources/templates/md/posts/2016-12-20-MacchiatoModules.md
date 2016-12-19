{:title "Macchiato Modules"
 :draft? true
 :layout :post
 :tags ["clojurescript" "macchiato" "node"]}
 
 As I discussed in the last post, Ring middleware stack closely resembles modules in a framework.
 
However, one notable difference is that middleware functions aren't directly aware of one another. When the handler is passed to the middleware function, it has no way of knowing what other middleware might have been wrapped around the handler by the time it got to it.

This presents a number of problems. We can end up with multiple copies of the same middleware wrapped around the handler, middleware could be wrapped in incorrect order, or required middleware might be missing altogether.

One way to mitigate the problem is by creating a default middleware stack, such as seen in [ring-defaults](https://github.com/ring-clojure/ring-defaults). This takes care of ensuring that all the core middleware is wrapped correctly, but doesn't help with middleware libraries added by the user.

The solution I came up with for Macchiato is to use metadata attached to the handler. The metadata will allow middleware functions to see the current state of the handler and choose the correct behavior based on that.

Let's take a look at an example of how this would work. Let's say we have the default handler such as:

```clojure
(defn handler [req res raise]
  (res {:body (str (-> req :params :name))}))
```

Then, let's say we have two middleware functions. The first will parse the request params, and the second will keywordize the params. The second function depends on the first in order to work.

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
(-> handler wrap-keyword-params wrap-params)
```

Let's see how we can use the metadata to ensure this is happening. We'll update the `wrap-params` and `wrap-keyword-params` functions as follows:

```clojure
(defn update-middleware-meta [handler middleware]
  (let [middleware ]
    (with-meta
      handler
      {:middleware
       ((fnil conj []) (:middleware (meta handler)) middleware)})))
    
(defn wrap-params [handler]
  (fn [req res raise]
    ((update-middleware-meta handler :wrap-params)
      (parse-params req) res raise))))


(defn wrap-keyword-params [handler]
  (let [middleware (-> handler meta :middleware)
    (when-not (some #{:wrap-params} middleware)
      (throw (js/Error. "missing required middleware :rwap-params")))
  (if (some #{:wrap-keyword-params} middleware)
    handler
    ((update-middleware-meta handler :wrap-keyword-params)
      (update req :params keywordize-params) res raise))))
```

Now, `wrap-keyword-params` is able to check whether the required middleware was loaded prior to running. The middleware also checks whether a copy is already present, and simply returns the handler if that's the case.


Some of the obvious metadata info would be the name of the function and the version. However, each middleware function would be able to add further metadata specific to it.


 
  
  
  