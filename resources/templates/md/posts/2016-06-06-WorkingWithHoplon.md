{:title "Consider Hoplon", :layout :post, :tags ["clojurescript" "hoplon"]}

A [recent discussion of Hoplon vs React](https://dl.dropboxusercontent.com/u/12379861/micha_on_hoplon_vs_react/index.html) has been making rounds. While I don't necessarily agree that using React is as difficult as Micha makes it sound, I do think that Hoplon provides an interesting alternative to React that has a number of benefits.

The main selling point for Hoplon is that it's simple. Hoplon doesn't use a virtual DOM, and thus it doesn't have a component lifecycle. One major benefit of this approach is in making it natural to use with existing Js libraries that expect to work with the browser DOM.

An example of this would be something like using a [jQuery date picker widget](https://github.com/cljsjs/packages/tree/master/jquery-daterange-picker). With Reagent, we'd have to use the lifecycle hooks, and make sure that the component is mounted in the browser DOM before the library is called. Conversely, we may need to consider the case of the component updating separately. While, it's not difficult to reason about in most cases, it does introduce some mental overhead. Using the same date picker in Hoplon can be seen [here](https://github.com/hoplon/jquery.daterangepicker/blob/master/src/hoplon/jquery/daterangepicker.cljs.hl).

However, while I found the idea of Hoplon interesting, I've never gave it a serious look due to the fact that it looked to be a monolithic stack. When you read Hoplon documentation, it's easy to get the impression that it has to be used with Boot, you have to use special `.hl` files to define ClojureScript, and you're expected to work with its server implementation.

This all can be appealing if you're looking for a full-stack solution where decisions have been made for you, but it's a bit of a deterrent for somebody who already has a preferred workflow and uses other tools such as Figwheel and Leiningen.

After having a discussion with Micha [on Reddit](https://www.reddit.com/r/Clojure/comments/4mi64q/hoplon_vs_react/), I realized that this wasn't the case and decided to give Hoplon another shot.

## The Setup

I used the [reagent-template](https://github.com/reagent-project/reagent-template) that I maintain as the base for he project by running the following command in the terminal:

```
lein new reagent hoplon-app
```

Next, I updated the dependencies in `project.clj` to remove the references to Reagent, and add the Hoplon dependency instead:

```clojure
  :dependencies [[org.clojure/clojure "1.8.0"]
                 [ring-server "0.4.0"]
                 [hoplon "6.0.0-alpha15"]
                 [ring "1.4.0"]
                 [ring/ring-defaults "0.2.0"]
                 [compojure "1.5.0"]
                 [hiccup "1.0.5"]
                 [yogthos/config "0.8"]
                 [org.clojure/clojurescript "1.9.36"
                  :scope "provided"]
                 [secretary "1.2.3"]]
```

That's all the changes I had to do in order to switch to using Hoplon in the project.

The next step was to open up the ClojureScript source in the `src/cljs/hoplon_app/core.cljs` file and replace the references to Reagent with Hoplon:

```clojure
(ns hoplon-app.core
  (:require
    [hoplon.core
     :as h
     :include-macros true]
    [javelin.core
     :refer [cell]
     :refer-macros [cell= dosync]]))

(h/defelem home []
  (h/div
    :id "app"
    (h/h3 "Welcome to Hoplon")))

(defn mount-root []
  (js/jQuery #(.replaceWith (js/jQuery "#app") (home))))

(defn init! []
  (mount-root))    
```

At this point I could start Figwheel and see the page load in the browser by running:

```
lein figwheel
```

As you can see the main difference so far is that we mount the Hoplon DOM using plain jQuery call, and the elements are defined using Hoplon helper macros.

Let's see how we can add a bit of state to our Hoplon app. Hoplon state management is handled by the [Javelin](https://github.com/hoplon/javelin) library. It uses a similar concept to the Reagent atom where we can define cells, and then whenever the state of the cells changes any elements that are looking at its value will be notified.

We'll create a simple to-do list to illustrate how this works. First, we need to create a cell to hold the data. We'll add the following code at the top of the namespace to do that:

```clojure
(def todo-items (cell ["foo"]))
```

The above code will define a Javelin cell that contains a vector with the string `"foo"` in it. We can now render the value of the cell as follows the the `home` element:

```clojure
(h/defelem home []
  (h/div
    :id "app"
    (h/h3 "Welcome to Hoplon")
    (h/p (cell= todo-items))))
```

The `cell=` call is reactive and whenever the state of the cell changes the paragraph will be repainted to with its current value. We can now add some code to add new items to the to-do list:

```clojure
(h/defelem add-todo []
  (let [new-item (cell "")]
    (h/div
      (h/input :type "text"
               :value new-item
               :change #(reset! new-item @%))
      (h/button :click #(dosync
                          (swap! todo-items conj @new-item)
                          (reset! new-item ""))
                (h/text "Add #~{(inc (count todo-items))}")))))
```

The above code should be fairly familiar to anybody who's used Reagent. We define a local state in a `let` binding and create a `div` that contains an `input` and a `button`. The `input` displays the value of the `new-item` cell and updates it in its `:change` event. Meanwhile, the button will swap the `todo-items` cell and add the value of the new item, then reset it to an empty string.

Notice that the button text displays the current item count. This is accomplished by Hoplon `#~` helper that allows us to easily display cell values within strings.

We should now be able to update our `home` element as follows to have the `add-todo` component show up on the page:

```clojure
(h/defelem home []
  (h/div
    :id "app"
    (h/h3 "Welcome to Hoplon")
    (h/p (cell= todo-items))
    (add-todo)))
```

When we add to-do items, they should be showing up in the list. So far everything looks nearly identical to working with Reagent.

Now, let's update the items to be rendered in the list a bit nicer. We'll write the following element to render the list:

```clojure
(h/defelem todo-list [{:keys [title]}]
  (h/div
      (h/h4 (or title "TODO"))
      (h/ul
        (h/for-tpl [todo todo-items]
          (h/li todo)))))
```

The element uses the Hoplon `for-tpl` macro to run through the elements in the list. The macro is used by Hoplon to map dynamically sized collections to DOM nodes. With the element in place, we can update our `home` element to display a nice HTML list:

```clojure
(h/defelem home []
  (h/div
    :id "app"
    (h/h3 "Welcome to Hoplon")
    (todo-list {:title "TODO List"})
    (add-todo)))
```

We should now see a list of items displayed that will get updated as we add items using the `add-todo` element. That's all there's to it. While it's a trivial app, I hope it gives you a taste of what working with Hoplon is like. The full source for the project can be seen [here](https://github.com/yogthos/hoplon-app).

### Conclusion

I was very pleasantly surprised by how easy it was to use Hoplon in a project setup with Leiningen and Figwheel. The semantics that Hoplon provides are very similar to Reagent, and are arguably simpler since there's no need to worry about the component lifecycle.

The one aspect of Reagent that I prefer is that the UI is defined declaratively using the Hiccup syntax. This makes it possible to manipulate UI elements as plain data. However, I don't think that using functions to define the UI is a deal breaker.

Overall, I think that Hoplon is often overlooked when ClojureScript UI libraries are considered, and this is very unfortunate. It's a solid library that provides clean and simple semantics to the user.

If, like me, you've been avoiding Hoplon because you were under the impression that you have to use it in a specific way, then I strongly urge you to give it another look.

