{:title "lib-noir access rule madness",
 :layout :post,
 :tags ["clojure" "noir"]}

Access rule handling in [lib-noir](https://github.com/noir-clojure/lib-noir) has seen some major rework. James Reeves pointed out that the way the `restrict` macro worked was not ideal as it wasn't entirely idiomatic and wasn't very composable. For example it didn't take into account the use of the `context` macro in Compojure.

While there are some breaking changes, it's pretty easy to migrate the old rules and the new approach provides a lot more flexibility.

The first thing that's changed is how the restricted routes are defined. The macro now wraps the handler itself instead of the whole route. So instead of doing

```clojure
(restricted GET "/private" [] handler)
```

you would now write:

```clojure
(GET "/private" [] (restricted handler))
```

Access rules definitions in the `noir.util.middleware/app-handler` have been revamped as well. The rules can now be specified by passing either a function representing a single rule or a map representing a group of rules.

When specified as a function, the rule must accept a single parameter that is the request map. Such rules will implicitly redirect to the "/" URI.

The rule group map contains the following keys:

* `:redirect` - the URI string or a function to specify where requests will be redirected to if rejected (optional defaults to "/")
* `:uri` - the URI for which the rules in the map will be activated (optional if none specified applies to all URIs)
* `:uris` - a vector of URI patterns for which the rules in the map will be activated (optional)
* `:rule` - a single rule function for the group
* `:rules` - a vector containing the rule functions associated with the specified `:redirect` and the `:uri`
* `:on-fail` - alternative to `:redirect` allows providing a function that accepts a request and handles the failure case

The `:rules` key can point to either a vector or a map. If the rules are a vector the default behavior is that every rule in the group must succeed. If rules are specified as a map, you can provide the resolution strategy using the `:any` and `:every` keys.

Let's take a look at an example of how this all works below:

```clojure
(def-restricted-routes

(defroutes app-routes
 ;;restricted routes
 (GET "/restricted" [] (restricted "this page is restricted"))
 (GET "/restricted1" [] (restricted "this is another restricted page"))
 (GET "/users/:id" [] (restricted "howdy"))
 (GET "/admin" [] (restricted "admin route"))
 (GET "/config" [] (restricted "config route"))
 (GET "/super-secret" [] (restricted "secret route"))
 ;;public routes
 (GET "/denied1" [] "denied")
 (GET "/denied2" [] "denied differently"))

(def app 
 (middleware/app-handler 
   [app-routes]
   :access-rules 
   [(fn [req] (session/get :user))

    {:uri "/restricted"
     :redirect "/denied1"
     :rule (fn [req] false)}

    {:redirect (fn [req] 
                 (log/info (str "redirecting " (:uri req)))
                 "/denied2")
     :uri "/users/*"
     :rule (fn [req] false)}

    {:uris ["/admin*" "/config*"]
     :rules {:any [(fn [req] (session/get :admin))
                   (fn [req] (session/get :root))]}}

    {:on-fail (fn [req] "you tried to access the super secret page!")
     :uri "/super-secret*"
     :rules [(fn [req] (session/get :admin))
             (fn [req] (session/get :root))]}

    {:uri "/super-secret*"
     :rules {:every [(fn [req] (session/get :admin))
                     (fn [req] (session/get :root))]
             :any   [(fn [req] (session/get :zeus))
                     (fn [req] (session/get :athena))]}}
]))
```

The first rule will be activated for any handler that's marked as restricted. This means that all of the restricted pages will redirect to `"/"` if there is no user in the session.

The second rule will only activate if the request URI matches `"/restricted"` and will be ignored for other URIs. The `"/restricted"` route will redirect to the `"/denied1"` URI.

The third rule will match any requests matching the `"/users/"` URI pattern. These requests will be redirected to the `"/denied2"` URI and the URI of the request will be logged.

The next rule group matches both the `"/admin*"` and the `"/config*"` patterns and required that either the `:admin` or the `:root` keys are set in the session in addition to the `:user` key specified by the global rule.

Next, we have a rule group that uses `:on-fail` function that can provide its own handler instead of doing a redirect. It requires that both  the `:admin` or the `:root` keys are set in the session.

Finally, we have a group that uses a mix of `:every` and `:any` keys to specify its rules.

The `access-rule` macro has been removed in favor of specifying rule groups directly in the handler. This makes it easier to see how all the rules are defined and what routes each set of rules affects.

With this new approach we can create independent rule groups for specific URI patterns as well as easily specify generic rules that affect all restricted handlers.

I found the new rule managing scheme to work better for my projects. I'd be interested on getting feedback whether it works for others as well and I'm always open to suggestions for improvements. :)