{:title "what's new in lib-noir",
 :layout :post,
 :tags ["luminus" "noir" "clojure"]}

It's been nearly a year since [lib-noir](https://github.com/noir-clojure/lib-noir) was split out into a stand-alone library. During this time the work on it has continued at a steady pace. There have been numerous bug fixes and many new features have been added to the library.

Many of these come either from user suggestions or contributions. So, if there is something that you'd like to see improved don't hesitate to submit an issue or make a pull request.

In this post I'd like to highlight some of the major new features that have been recently added.

### Middleware

The `app-handler` in `noir.util.middleware` now accepts optional`:middleware` and `:access-rules` parameters.

Since the outer middleware is evaluated first, if you wrap the `app-handler` in custom middleware it will execute before any of the standard middleware is executed. This is a problem if you wish to get access to things like the session, eg:

```clojure
(defn log-user-in-session [handler]
  (fn [req]
    (timbre/info (session/get :user))
    (handler req)))

(def app (-> (middleware/app-handler all-routes)
             log-user-in-session))
```

If we try to run our app with the above handler we'll get the following exception:

```clojure
java.lang.ClassCastException: clojure.lang.Var$Unbound cannot be cast to java.util.concurrent.Future
```

This happens due to the fact that `noir.session` uses the `*noir-session*` dynamic variable to keep track of the session. This variable is bound by the `wrap-noir-session` middleware. Since the `log-user-in-session` executes before it, the session is not yet bound.

The `:middleware` key allows specifying a vector containing custom middleware to wrap the handler before the standard middleware:

```clojure
(def app (middleware/app-handler all-routes
          :middleware [log-user-in-session]))
```

Now, the `log-user-in-session` will be called after the `wrap-noir-session` is called and work as expected.

The `:access-rules` key allows specifying the access rules for the `wrap-access-rules` middleware. Each set of rules should be specified as a vector with the contents matching the `wrap-access-rules` arguments:

```clojure
(defn private-pages [method url params]    
    (session/get :user-id))

(def app (middleware/app-handler all-routes 
          :access-rules
          [[{:redirect "/unauthorized"} private-pages]]))
```

There's also a new middleware wrapper called `wrap-rewrites` that allows rewriting URIs based on regex. 

The rewrite rules should be supplied as pairs of the regex and the string the matching URL should be rewritten with. The first regex that matches the request's URI will cause it to be replaced with its corresponding string before calling the wrapped handler:

```clojure
(wrap-rewrites handler #"/foo" "/bar")
```
Above, all occurances of  the`/foo` URI will be replaced with `/bar`.

### Routes

There's now a `noir.util.route/def-restricted-routes` macro for creating groups of restricted routes. Where before you had to do something like this:

```clojure
(defroutes private-routes
  (restricted GET "/route1" [] handler1)
  (restricted GET "/route2" [] handler2)
  (restricted GET "/route3" [] handler3)
  (restricted GET "/route4" [] handler4))
```

you can now simply do:

```clojure
(def-restricted-routes private-routes
  (GET "/route1" [] handler1)
  (GET "/route2" [] handler2)
  (GET "/route3" [] handler3)
  (GET "/route4" [] handler4))
```

The macro will automatically mark all the routes as restricted for you. 


Finally, the access rules used to control the `restricted` routes are more flexible now as well. The redirect target can now point to a function as well as a string, eg:

```clojure
(def app (middleware/app-handler all-routes 
          :access-rules
          [[{:redirect 
             (fn [] 
              (println "redirecting") "/unauthorized")} 
             private-pages]]))
```

As always, [Luminus](http://www.luminusweb.net/) provides the latest `lib-noir`, so all the new features are available there as well.






