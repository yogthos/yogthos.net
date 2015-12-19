{:title "a look at macros", :layout :post, :tags ["clojure"]}

Lisp macros can be rather confusing and especially so for newcomers. In fact, the rule of thumb is not to use macros if you can avoid them. That said, macros can be an incredibly powerful tool and have innumerable uses. I'd like to give a concrete example of a macro that I'm using in this blog engine.

I wanted to be able to cache page content in memory, so that the page doesn't need to be generated for every single request. This means that before rendering a page I want to check if the page is in my cache, and if the cache hasn't expired then serve the cached page, otherwise render a new version and cache it.

First I created an atom which would store the cached content:
```clojure
(def cache (atom {}))
```
Next I wrote the cache logic for the `/blog` page:
```clojure
(defpage "/blog/:postid" {:keys [id]}
  (let [last-updated (:time (get @cache id))
        cur-time     (.getTime (new java.util.Date))]

    (if (or (nil? last-updated)
            (> (- cur-time last-updated) 10000))
      (swap! cache assoc id {:time cur-time 
                             :content (entry (db/get-post id))}))
    (:content (get @cache id)))
```

Obviously, we don't want to repeat this logic each time we wish to cache something, and we'd like an easy way to modify existing functions to allow caching. Here's where macros come in. One property of macros is that, unlike functions, they do not execute the s-expressions which are passed in. Let's look at how this works in practice:
```clojure
(defn foo [] (println "foo was called"))

(defn bar [f])

(bar (foo))

=>foo was called
```

Here `foo` is executed as we would expect and "foo was called" is printed, but what happens if we make bar a macro instead?
```clojure
(defmacro bar [f])
(bar (foo))
=>
```

This time nothing is printed! In a macro the parameters are treated as data and are not evaluated unless we explicitly choose to do so:
```clojure
(defmacro bar [f] f)
(bar (foo))
=>foo was called
```

A macro allows us to change code before it is compiled, and at compile time it is replaced with its output. We can check this by running `macroexpand`:
```clojure
(macroexpand '(bar (foo)))
=>(foo)
```

We can see that `(bar (foo))` simply gets replaced with `(foo)` which is what our macro is returning. While the previous version would evaluate to nil, and `foo` would never be executed.

As you might have guessed by now, we can pass any s-expression to a macro and then decide inside the macro whether we'd like to evaluate it. So, let's see how we can use this to make our caching macro:
```clojure
(defmacro cache [id content]
  `(let [last-updated# (:time (get @cached ~id))
         cur-time#     (.getTime (new java.util.Date))]

      (if (or (nil? last-updated#)
              (> (- cur-time# last-updated#) 10000))
        (swap! cached assoc ~id {:time cur-time#
                                 :content ~content}))
      (:content (get @cached ~id))))
```

We can move the logic which checks if we should use a cached value into our macro and pass in the id and the s-expression to run if cache needs to be updated. The code looks very similar to our original version, except for a few new symbols. First thing you'll notice is that we used ` in front of our _let_ expression, this quotes the body of the expression. The # at the end of the binding names ensures that the names are unique and won't collide with other symbols at compile time. Finally ~ says that the next expression should be unquoted.

Let's run _macroexpand_ again to make sure our macro is outputting something reasonable:
```clojure
(pprint (macroexpand '(cache postid (entry (get-post postid)))))

(let*
 [last-updated__1294__auto__
  (:time (clojure.core/get @agents/cached postid))
  cur-time__1295__auto__
  (.getTime (new java.util.Date))]
 (if
  (clojure.core/or
   (clojure.core/nil? last-updated__1294__auto__)
   (clojure.core/>
    (clojure.core/- cur-time__1295__auto__ last-updated__1294__auto__)
    10000))
  (clojure.core/swap!
   agents/cached
   clojure.core/assoc
   postid
   {:content (entry (get-post postid)), :time cur-time__1295__auto__}))
 (:content (clojure.core/get @agents/cached postid)))
```

This definitely looks like the logic we're expecting. Any time we use this macro, it will be replaced with the code similar to the above, where the s-expression is inside the _if_ block, and only gets called if cache needs to be updated. Now we can easily cache any s-expressions with minimal change to the original code and all the caching logic sits in one convenient place:
```clojure
(defpage "/blog/:postid" {:keys [postid]}
  (cache postid (entry (db/get-post postid))))
```

As I've mentioned before, there are many other uses for macros, but I hope this gives a clear example of a concrete situation where a macro facilitates cleaner code and provides an easy way to avoid repetition.







