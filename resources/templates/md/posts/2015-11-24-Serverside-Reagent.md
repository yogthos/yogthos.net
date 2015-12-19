{:title "Rendering Reagent on the Server using Hiccup"
:layout :post
:tags ["clojurescript" "reagent" "clojure"]}

I recently watched a great talk titled [Optimizing ClojureScript Apps For Speed](https://www.youtube.com/watch?v=fICC26GGBpg), where Allen Rohner discusses the benefits and hurdles of server-side rendering.

React supports hooking in to server generated HTML at runtime. However, since React is a JavaScript library it becomes problematic to leverage this functionality from Clojure. While the JVM provides a Js runtime with Nashorn, it's extremely slow and requires a lot of twiddling to work for even basic examples.

Another approach is to run an instance of Node.js and farm out React rendering to it. This avoids the limitations of Nashorn, but introduces a host of new problems described in the talk.

Allen then proposes an alternative approach where he implements parts of the Om API and cross-compiles the components that way. You can see how this works in his [Foam](https://github.com/arohner/foam) library.

The main difficulty identified in the talk is in implementing a sufficient amount of Om API in order to generate HTML on the server.

This got me thinking about what it would take to leverage this approach using Reagent. Unlike Om, Reagent has a tiny API and the only part of it used to create components is the Reagent atom implementation. The components themselves are written using plain Hiccup syntax.

Let's see how this could work. We'll start by creating a new Reagent project:

```
lein new reagent reagent-serverside
```

Next, we'll add a new namespace in called `reagent-serverside.home` `src/cljc/reagent_serverside/home.cljc`. This namespace will house the home page component that we'll pre-render on the server.

All we have to do now is to use a reader conditional to only require the Reagent atom during ClojureScript compilation:

```clojure
(ns reagent-serverside.home
  #?(:cljs
     (:require [reagent.core :as reagent :refer [atom]])))
```

We can now write our components as we would normally:

```clojure
(ns reagent-serverside.home
  #?(:cljs
     (:require [reagent.core :as reagent :refer [atom]])))

(def items (atom nil))

(defn item-list [items]
  [:ul
   (for [item items]
     ^{:key item}
     [:li item])])

(defn add-item-button [items]
  [:button
   {:on-click #(swap! items conj (count @items))}
   "add item"])

(defn home-page []
  [:div [:h2 "Welcome to reagent-serverside"]
   [add-item-button items]
   [item-list @items]])
```

We'll have the `items` atom to house a collection of items, an `item-list` function to render it, and the `home-page` function that will use the `item-list` component. We also have a button that lets the user add new items with an `:on-click` event. This is all standard Reagent code.

### Rendering on the Server

Now, let's navigate to the `reagent-serverside.handler` namespace and reference the `reagent-serverside.home` we just created.

```clojure
(ns reagent-serverside.handler
  (:require ...
            [reagent-serverside.home :refer [items home-page]]))
```

We'll now have to write the functions that will traverse the components and render them as appropriate. We'll attach a `:data-reactid` key to each one to give it an identifier that React looks for, and inject the result into our Hiccup markup.

```clojure
(defn react-id-str [react-id]
  (assert (vector? react-id))
  (str "." (clojure.string/join "." react-id)))

(defn set-react-id [react-id element]
  (update element 1 merge {:data-reactid (react-id-str react-id)}))

(defn normalize [component]
  (if (map? (second component))
    component
    (into [(first component) {}] (rest component))))

(defn render
  ([component] (render [0] component))  
  ([id component]
   (cond
    (fn? component)
    (render (component))    

    (not (coll? component))
    component
    
    (coll? (first component))
    (map-indexed #(render (conj id %1) %2) component)
    
    (keyword? (first component))
    (let [[tag opts & body] (normalize component)]
      (->> body
           (map-indexed #(render (conj id %1) %2))
           (into [tag opts])
           (set-react-id id)))
    
    (fn? (first component))
    (render id (apply (first component) (rest component))))))

(reset! items (range 10))

(def mount-target
  [:div#app (render home-page)])
```

The `render` function will recursively walk the components evaluating any functions it finds and assigning the React id to each element.

Next, we'll set the `items` atom to a range of numbers, and then call `render` inside the `mount-target` to generate the markup.

### Rendering on the Client

Finally, let's navigate to the `reagent-serverside.core` namespace in the `src/cljs` source path. We'll update it to reference the `home` namespace we created and render the `home-page` component on load.

```clojure
(ns reagent-serverside.core
    (:require [reagent.core :as reagent :refer [atom]]
              [reagent-serverside.home :refer [items home-page]]))

(defn mount-root []
  (reagent/render [home-page] (.getElementById js/document "app")))

(defn init! []
  (reset! items (range 20))
  (mount-root))
```

When we load the page we'll immediately see the server generated markup and then it will be updated by Reagent when ClojureScript is loaded. There are a few caveats here that you should be aware of.

Any components you wish to render on the server have to be written in `cljc`, so you may end up having to add some shims for things like Ajax calls.

The component syntax has to work with both Reagent and Hiccup, so you have to be mindful to use the common subset.

React is fairly picky about the structure and the `data-reactid` tags. So, it can be tricky to generate a DOM tree that it likes. The example in the post will give a React warning about the DOM being different. Some more work is needed around this.

However, even in the case that React doesn't reuse the DOM, the user will see the page immediately and you'll get the benefits of SEO for your site.

Full source is available on [GitHub](https://github.com/yogthos/reagent-serverside).

### Conclusions

Overall, I'm very happy with the results and it looks like it would be fairly easy to wrap this up into a library. The data focused approach is a huge win for Reagent here in my opinion. Since the components are laid out using regular Clojure data structures there's no need to implement any special API and things just work out of the box.