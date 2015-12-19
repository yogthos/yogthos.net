{:title "Moving to Compojure",
 :layout :post,
 :tags ["compojure" "clojure" "noir"]}

It was [recently announced](http://blog.raynes.me/blog/2012/12/13/moving-away-from-noir/) that [Noir](https://github.com/noir-clojure/noir) is being deprecated. The primary reason cited is that it simply doesn't add a lot of useful functionality over what's already available in Compojure and makes it difficult to integrate other middleware, such as [friend](https://github.com/cemerick/friend). 

The useful parts of Noir have been moved to [lib-noir](https://github.com/noir-clojure/lib-noir). Together, Compojure and lib-noir provide a very similar experience to what you're already used to if you've been using Noir up to now.

There are some differences of course. The main one is that instead of using the `defpage` macro, you would now declare your routes using `defroutes`.

So, if you previously had something like the following:

```clojure
(defpage "/" []
  (common/layout 
    (form-to [:post "/"]                           
              (text-area {:placeholder "say something..."} "message") 
              [:br]
              (text-field {:placeholder "name"} "id")
              (submit-button "post message"))))

(defpage [:post "/"] params
  (common/layout 
    [:p (:id params) " says " (:message params)]))
```

Noir would then create the GET and POST routes for "/" behind the scenes. With Compojure we'll have to define the routes explicitly using `defroutes`.

```clojure
(defroutes app-routes  
  (GET "/" [] (message))
  (POST "/" params (display-message params))
  (route/resources "/")
  (route/not-found "Not Found"))
```

Then, we'll write the `message` and `display-message` functions and put the logic for the pages in them.

```clojure
(defn message []
  (html5 
    [:body 
     (form-to [:post "/"]                           
              (text-area {:placeholder "say something..."} "message") 
              [:br]
              (text-field {:placeholder "name"} "id")
              (submit-button "post message"))]))

(defn display-message [params]
  (let [form-params (:form-params params)] 
    (html5 
      [:body 
       [:p (get form-params "id") " says " (get form-params "message")]])))
```

The Noir template comes with a `common` namespace which defines a layout macro, which we use to wrap our pages so that we don't have to keep typing in the boilerplate. We can easily write a helper function to do the same thing.

```clojure
(ns myapp.common
  (:use [hiccup.def :only [defhtml]] 
        [hiccup.page :only [include-css]]))
       
(defhtml layout [& body]  
  [:head
   [:title "Welcome to myapp"]
   (include-css "/css/screen.css")]
  (into [:body] body))
```

The next difference is that our request map contains the complete request as opposed to just the form params as is the case with the one in `defpage`.

This means that we have to grab the `:form-params` key from it to access the form parameters. Another thing to note is that the parameter keys are strings, meaning that we can't destructure them using `:keys`.

This problem is also easily addressed  by a macro which will grab the form-params and keywordize them for us. Note that the original request map will still be available as `request` in the resulting function.

```clojure
(defmacro page [f form-params & body]
  `(defn ~f [~'request]
     (let [~form-params 
           (into {} (for [[k# v#] (:form-params ~'request)] 
                      [(keyword k#) v#]))]
       ~@body)))
```

Now, we can rewrite our app as follows:

```clojure
(page message []
  (layout
    (form-to [:post "/"]                           
             (text-area {:placeholder "say something..."} "message") 
             [:br]
             (text-field {:placeholder "name"} "id")
             (submit-button "post message"))))

(page display-message {:keys [id message]}
  (layout
      [:p id " says " message]))

(defroutes app-routes  
  (GET "/" [] (message []))
  (POST "/" params (display-message params))
  (route/resources "/")
  (route/not-found "Not Found"))
```

**update**

Turns out Compojure already provides the functionality provided by the page macro, and to get the form params, we can destructure them as follows:

```clojure
(defn display-message [id message]
  (layout [:p id " says " message]))

(defroutes app-routes  
  (POST "/" [id message] (display-message id message))
  (route/not-found "Not Found"))
```

Big thanks to James Reeves  aka [weavejester](https://github.com/weavejester) on [setting me straight](http://www.reddit.com/r/Clojure/comments/14wlew/migrating_from_noir_to_compojure/c7h50m1) there. :)

This is starting to look very similar to the Noir style apps we're used to. Turns out that migrating from Noir to Compojure is fairly painless. 

If you use lib-noir when converting your existing Noir application, then the changes end up being minimal. You can continue using noir.crypt, noir.validation, and etc. as you did before. The only caveat is that you now have to remember to add the appropriate wrappers to your handler, eg:

```clojure
(-> handler
  (wrap-noir-cookies)
  (session/wrap-noir-session 
    {:store (memory-store session/mem)})
  (wrap-noir-validation))
```

One thing which Noir provided was a nice batteries included template. I created a similar one called [compojure-app](https://github.com/yogthos/compojure-template).

To use the template you can simply run:

```bash
lein new compojure-app myapp
```

The template sets up a project with a `main`, which can be compiled into a standalone using `lein uberjar` or into a deployable WAR using `leing ring uberwar`. The project is setup to correctly handle loading static resources located in `resources/public` and correctly handle the servlet context. 

When run with `lein run` the project will pickup the dev dependencies and use the `wrap-reload`, so that changes to source are picked up automatically in the running app.

This should get all the boiler plate out of the way and let you focus on making your app just as you did with Noir. :)


  