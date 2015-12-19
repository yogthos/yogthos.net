{:title "lib-noir updates", :layout :post, :tags ["clojure" "luminus"]}

I've had a bit of time to hack on lib-noir recently. Specifically, I decided to update the handling of access rules.

Previously, you could use `wrap-access-rules` by passing one or more rule functions. Each function would accept a `method`, `url`, and `params` and return a boolean indicating whether the rule is satisfied. Using these functions the wrapper would then decide wether the page should be displayed or if the client will be redirected to "/".

This was serviceable for doing some basic restrictions, like making pages private where a rule would check if a user was in the session:

```clojure
(defn private-page [method url params]
  (session/get :user))
```
However, it provided no way to redirect to a different URIs based on what rules failed. The update allows using multiple `wrap-access-rules` wrappers each redirecting to its own redirect URI, as follows:

```clojure
(-> handler
  (wrap-access-rules rule1)
  (wrap-access-rules {:redirect "/unauthorized"} rule2 rule3))
```

The first set of rules that fails will redirect to its redirect target, defaulting to "/" if none is provided. This way we can create rule groups each having different behaviours.

Another addition is the `noir.util.route/access-rule` macro. The macro accepts a URI pattern and a condition. The condition is only checked if the URI of the page being checked matches the pattern.

The macro implicitly defines the `method`, `url`, and `params` variables, so they can be used by the logic in the condition:

```clojure
(def private-pages
  (access-rule "/private/:id" (= (session/get :user) (first params))))
```

The above rule will only be triggered for pages matching the "/private/:id" pattern. Hopefully, the new additions will make it easier to work with access rules in lib-noir. Complete documentation for the feature is available at [Luminus](http://www.luminusweb.net/docs/routes.md).

I'm also interested in hearing any feedback and suggestions regarding the current implementation. :)


 **update**
***

After a bit of discussion with [Ed Tsech](https://github.com/edtsech), we decided that it would be better to make the parameters to the `access-rule` explicit.

So, now instead of defining access-rule by simply providing the URL pattern and a condition, you would also pass the arguments vector with the method, url, and params:

```clojure
(def private-pages 
  (access-rule "/private/:id"  [_ _ params] 
    (= (session/get :user) (first params))))
```
While it's slightly more verbose, it's a lot less magical and there's no risk of the macro masking any variables in scope.


 