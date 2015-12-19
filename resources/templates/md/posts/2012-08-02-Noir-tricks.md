{:title "Noir tricks", :layout :post, :tags ["noir" "clojure"]}

This blog is built on top of [Noir](http://www.webnoir.org/), which is quite excellent for the most part. However, I did run into one problem which I spent a bit of time on. I'd like to share my workarounds to save others time.

First issue I noticed is that `response/redirect` doesn't respect the servlet context. This means that if you're not deploying your app to the root context, your redirects will not work properly. 

After some digging and questions on the Google groups I found out that the offending function is `resolve-url` in `noir.options` namespace. When it builds the URL string it doesn't check for the context and as such the resulting URL ends up redirecting to the root of the app server regardless of what context the servlet was deployed at.

My workaround for this is a bit of a hack, and if anybody has a better solution I'd love to know, but it works well for most purposes. In my `server.clj` I added a new handler wrapper, which redefines the offending function with one that checks if the URL is relative and prepends the context to it as needed.
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

A related issue is that `pre-route` doesn't respect the context either. I decided to simply write a macro for defining private pages:
```clojure
(defmacro private-page [path params & content]
  `(noir.core/defpage 
     ~path 
     ~params 
     (if (session/get :admin) 
       (do ~@content) (resp/redirect "/"))))
```

An added advantage of the macro is that I don't have to remember to update `pre-routes` when I want to make a page private. 

Also, there are a couple of things to be aware of if you wish to make a WAR. Make sure that all your views are required in your server namespace, `:gen-class` is set and that `server/load-views-ns` is used instead of `server/load-views`:
```clojure
(ns yuggoth.server
  (:require 
   ...
   [yuggoth.views archives auth blog comments common profile rss upload])
   (:gen-class))

(server/load-views-ns 'yuggoth.views)
```

In your project.clj add the following:
```clojure
:ring {:handler yuggoth.server/handler}
```

With the above in place you can build an uberwar with
```bash
lein ring uberwar
```

The resulting WAR should deploy on any app server such as Tomcat or Glassfish without problems. Aside from the above quirks, I haven't run into any other issues with Noir, and I'm absolutely in love with it. 


