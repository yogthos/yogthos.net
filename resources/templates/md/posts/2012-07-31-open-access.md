{:title "open access", :layout :post, :tags []}

Sometimes you might run into a situation where you're using a library which defines a certain function in a way that might not work the way you need it to in a particular context. To make things worse, this function might be used by the library internally, so you can't simply write your own version and use it. 

In some languages it's possible to use [monkey patching](http://en.wikipedia.org/wiki/Monkey_patch) to get around this problem. This approach allows you to simply redefine the offending function at runtime with your own version. The downside of this approach is that the change is global and as such might interact poorly with other code which expects the original version.

 In Clojure it's possible redefine an existing function in a particular context using `with-redefs`. This approach gives us the ability to make runtime modifications in a safer fashion where we know exactly what code is affected. 

Let's look at an example where we have a `get-data` function defined in namespace `foo` which is used by `display-results` in namespace `bar`. When we write tests for `bar` we would like to use preset test data instead of calling out to the database:
```clojure
(ns foo)

(defn get-data []
  ;gets some data from a db
  )

(ns bar
 (:require foo))

(defn display-results []
  (apply str (interpose ", " (foo/get-data))))

(ns tests
  (:use clojure.test)
  (:require foo bar))

(deftest display-results-test
  (with-redefs [foo/get-data (fn[] ["Doe", "John"])]
    (is (= "Doe, John" (bar/display-results)))))
```
Now any code that references `foo/get-data` inside the `with-redefs` scope will get `["Doe", "John"]` as a result. 