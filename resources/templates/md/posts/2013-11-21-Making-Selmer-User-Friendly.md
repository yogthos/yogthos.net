{:title "Making Selmer User Friendly",
 :layout :post,
 :tags ["selmer" "luminus" "clojure"]}

It's been nearly 5 month since Selmer was released. In that time many bugs have been squashed and lots of new features added. However, there is one aspect that remained shameful and that was error reporting.

When Selmer failed to parse a template it would often produce error messages that were less than useful. For example, given the following template:

```xml
<html>
  <body>
    {% blok %}
    {% endblock %}
    <h2>Hello {{name}}</h2>
  </body>
</html>
```

we'd end up with the following error after trying to render it:

```
Exception in thread "main" java.lang.Exception: unrecognized tag: :blok - did you forget to close a tag?
```

While the error indicated the name of the problem tag, it didn't say what template this tag originated from or on what line it appeared.

These types of errors can result in a lot of wasted time and frustration. It would be much better to provide a clear error that contains the actual offending tag along with the name of the template and the line number.

As of version `0.4.8`, Selmer has a validator that checks the following cases:

* can the tag be parsed successfully
* is the filter found in the map of filters
* does the tag contain a name
* is the tag name found in the map of tags
* if a tag is a block tag, is the corresponding closing tag found
* is the tag a closing tag for an opening tag that's not present

Here's the error returned by the validator when rendering the above template:

```
Exception in thread "main" java.lang.Exception: Unrecognized tag: {% blok %} on line 3 for template file:/Users/Yogthos/selmer-test/resources/index.html
```

This gives us a lot more information as to what went wrong and where. This is a big improvement on the original error, however we still have an ugly stacktrace to look at to figure out what happened.

It would be even better to return a distinct validation error that could be intercepted by some middleware to produce a friendly error page.

This is precisely what Selmer does as of version `0.5.3`. The validator will now return `ex-info` with a key `:type` that's set to `:selmer-validation-error`.

It will also contain an error page template that can be rendered using the `ex-data` attached to the exception. We can now write a simple middleware function to catch these errors and render the error page:

```clojure
(defn template-error-page [handler]
  (fn [request]
    (try
      (handler request)
      (catch clojure.lang.ExceptionInfo ex
        (let [{:keys [type error-template] :as data} (ex-data ex)]
          (if (= :selmer-validation-error type)
            {:status 500
             :body   (selmer.parser/render error-template data)}
            (throw ex)))))))
```

Using the above middleware, we'll see the following page whenever the parser fails to compile a template:

<center>
![Selmer error](http://yogthos.net/files/selmererror.png)
</center>

We can now immediately tell that an error occurred during the template compilation and see only the information pertaining to the nature of the error.

Of course, we wouldn't want to display this information when running in production. A simple solution would be to set a `dev` flag and check for it in our middleware.

This is precisely what the latest [Luminus](http://www.luminusweb.net/) template will do using the [environ](https://github.com/weavejester/environ) library. The `project.clj` now contains an `:env` key under the `:dev` profile with the `:selmer-dev` flag set to `true`:

```clojure
:dev {:dependencies [[ring-mock "0.1.5"]
                     [ring/ring-devel "1.2.1"]]
      :env {:selmer-dev true}}}
```

The middleware will check that the key is present and only render the error page in development mode:

```clojure
(defn template-error-page [handler]
  (if (env :selmer-dev)
    (fn [request]
      (try
        (handler request)
        (catch clojure.lang.ExceptionInfo ex
          (let [{:keys [type error-template] :as data} (ex-data ex)]
            (if (= :selmer-validation-error type)
              {:status 500
               :body (parser/render error-template data)}
              (throw ex))))))
    handler))
```

When it comes to writing libraries it's easy to forget about the little things like error reporting and documentation. However, these things are just as important as having good code and a clean API. 

In the end, this is what makes the difference between a pleasant development experience and one that's fraught with frustration.

