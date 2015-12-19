{:title "Building Single Page Apps with Reagent",
 :layout :post,
 :tags ["reagent" "clojure" "clojurescript"]}

## Background

I recently started working on a new project that has a significant UI component. I decided that this was a good opportunity to take a look at Angular and React for building the client as a single page application.

After a bit of evaluation, I decided that React was a better fit for the project. Specifically, I found the idea of the virtual DOM very appealing and its component based approach to be a good way to manage the application state.

Once I got a bit deeper into using React I found it lacking in many areas. For example, it doesn't provide an adequate solution for complex data binding and while there are a few libraries such as [react-forms](https://github.com/prometheusresearch/react-forms), I didn't find them to be a good fit for my needs.

Having heard lots of great things about Om, I decided that this might be a good time to revisit ClojureScript. While I've done some projects in ClojureScript [previously](http://yogthos.net/blog/43-Introducing+cljs-ajax), I always ended up going back to JavaScript in the end.

For me, the benefits were not enough to outweigh the maturity of JavaScript and the tooling available for it. One of the things I found to be particularly painful was debugging generated JavaScript. This problem has now been addressed by the addition of source maps.

## Trying Om

As I went through Om tutorials, I found that it exposes a lot of the incidental details to the user. Having to pass `nil` arguments, reify protocols, and manually convert to Js using `#js` hints are a but a few warts that I ran into. Although, it's worth noting that the [om-tools](https://github.com/Prismatic/om-tools) library from Prismatic address some of these issues.

Overall, I feel that Om requires a significant time investment in order to become productive. I found myself wanting a higher level of abstraction for creating UI components and tracking state between them. This led me to trying [Reagent](http://holmsand.github.io/reagent/). This library provides a very intuitive model for assembling UI components and tracking their state, and you have to learn very few concepts to start using it efficiently.

## Differences between Om and Reagent

Om and Reagent make different design decisions that result in different tradeoffs, each with its own strength and weaknesses. Which of these libraries is better primarily depends on the problem you're solving.

The biggest difference between Om and Reagent is that Om is highly prescriptive in regards to state management in order to ensure that components are reusable. It's an anti-pattern for Om components to manipulate the global state directly or by calling functions to do so. Instead, components are expected to communicate using [core.async](https://github.com/clojure/core.async) channels. This is done to ensure high modularity of the components. Reagent leaves this part of the design up to you and allows using a combination of global and local states as you see fit.

Om takes a data centric view of the world by being agnostic about how the data is rendered. It treats the React DOM and Om components as implementation details. This decision often results in code that's verbose and exposes incidental details to the user. These can obviously be abstracted, but Om does not aim to provide such an abstraction and you'd have to write your own helpers as seen with Prismatic and om-tools.

On the other hand, Reagent provides a standard way to define UI components using [Hiccup](https://github.com/weavejester/hiccup) style syntax for DOM representation. Each UI component is a data structure that represents a particular DOM element. By taking a DOM centric view of the UI, Reagent makes writing composable UI components simple and intuitive. The resulting code is extremely succinct and highly readable. It's worth noting that nothing in the design prevents you from swapping in custom components. The only constraint is that the component must return something that is renderable.

## Using Reagent

The rest of this post will walk through building a trivial Reagent app where I hope to illustrate what makes Reagent such an excellent library. Different variations of CRUD apps are probably the most common types of web applications nowadays. Let's take a look at creating a simple form with some fields that we'll want to collect and send to the server.

I won't go into details of setting up a ClojureScript project in this post, but you can use the [reagent-example](https://github.com/yogthos/reagent-example) project to follow along. The project requires [Leiningen](http://leiningen.org/) build tool and you will need to have it installed before continuing.

Once you check out the project, you will need to start the ClojureScript compiler by running `lein cljsbuild auto` and run the server using `lein ring server`.

The app consists of UI components that are tied to a model. Whenever the user changes a value of a component, the change is reflected in our model. When the user clicks the submit button then the current state is sent to the server.

The ClojureScript code is found in the `main.core` under the `src-cljs` source directory. Let's delete its contents and start writing our application from scratch. As the first step, we'll need to reference `reagent` in our namespace definition.

```clojure
(ns main.core
 (:require [reagent.core :as reagent :refer [atom]]))
```

Next, let's create a Reagent component to represent the container for our page.

```clojure
(defn home []
  [:div
    [:div.page-header [:h1 "Reagent Form"]]])
```

We can now render this component on the page by calling the `render-component` function.

```clojure
(reagent/render-component [home]
  (.getElementById js/document "app"))
```

As I mentioned above, the components can be nested inside one another. To add a text field to our form we'll write a function to represent it and add it to our `home` component.


```clojure
(defn text-input [label]
  [:div.row
    [:div.col-md-2
      [:span label]]
    [:div.col-md-3
      [:input {:type "text" :class "form-control"}]]])

(defn home []
  [:div
    [:div.page-header [:h1 "Reagent Form"]]
    [text-input "First name"]])
```

Notice that even though `text-input` is a function we're not calling it, but instead we're putting it in a vector. The reason for this is that we're specifying the component hierarchy. The components will be run by Reagent when they need to be rendered.

We can also easily extract the row into a separate component. Once again, we won't need to call the `row` function directly, but can treat the component as data and leave it up to Reagent when it should be evaluated.

```clojure
(defn row [label & body]
  [:div.row
   [:div.col-md-2 [:span label]]
   [:div.col-md-3 body]])

(defn text-input [label]
  [row label [:input {:type "text" :class "form-control"}]])

```

We now have an input field that we can display. Next, we need to create a model and bind our component to it. Reagent allows us to do this using its `atom` abstraction over the React state. The Reagent atoms behave just like standard Clojure atoms. The main difference is that a change in the value of the atom causes any components that dereference it to be repainted.

Any time we wish to create a local or global state we create an atom to hold it. This allows for a simple model where we can create variables for the state and observe them as they change over time. Let's add an atom to hold the state for our application and a couple of handler functions for accessing and updating it.

```clojure
(def state (atom {:doc {} :saved? false}))

(defn set-value! [id value]
  (swap! state assoc :saved? false)
  (swap! state assoc-in [:doc id] value))

(defn get-value [id]
  (get-in @state [:doc id]))

```

We can now update our `text-input` component to set the state when the `onChange` event is called and display the current state as its `value`.

```clojure
(defn text-input [id label]
  [row label
   [:input
     {:type "text"
       :class "form-control"
       :value (get-value id)
       :on-change #(set-value! id (-> % .-target .-value))}]])

(defn home []
  [:div
    [:div.page-header [:h1 "Reagent Form"]]
    [text-input :first-name "First name"]])
```

Let's add a save button to our form so that we can persist the state. For now, we'll simply log the current state to the console.

```clojure
(defn home []
  [:div
    [:div.page-header [:h1 "Reagent Form"]]
    [text-input :first-name "First name"]    
    [:button {:type "submit"
              :class "btn btn-default"
              :on-click #(.log js/console (clj->js @state))}
     "Submit"]])
```

If we open the console, then we should see the current value of the `:first-name` key populated in our document whenever we click submit. We can now easily add a second component for the last name and see that it gets bound to our model in exactly the same way.

```clojure
(defn home []
  [:div
    [:div.page-header [:h1 "Reagent Form"]]

    [text-input :first-name "First name"]
    [text-input :last-name "First name"]

    [:button {:type "submit"
              :class "btn btn-default"
              :onClick #(.log js/console (clj->js @state))}
     "Submit"]])
```

So far we've been using a global variable to hold all our state, while it's convenient for small applications this approach doesn't scale well. Fortunately, Reagent allows us to have localized states in our components. Let's take a look at implementing a multi-select component to see how this works.

When the user clicks on an item in the list, we'd like to mark it as selected. Obviously, this is something that's only relevant to the list component and shouldn't be tracked globally. All we have to do to create a local state is to initialize it in a closure.

We'll implement the multi-select by creating a component to represent the list and another to represent each selection item. The list component will accept an id and a label followed by the selection items.

Each item will be represented by a vector containing the id and the value of the item, eg: `[:beer "Beer"]`. The value of the list will be represented by a collection of the ids of the currently selected items.

We will use a `let` binding to initialize an atom with a map keyed on the item ids to represent the state of each item.

```clojure
(defn selection-list [id label & items]
  (let [selections (->> items (map (fn [[k]] [k false])) (into {}) atom)]    
    (fn []
      [:div.row
       [:div.col-md-2 [:span label]]
       [:div.col-md-5
        [:div.row
         (for [[k v] items]
          [list-item id k v selections])]]])))
```

The item component will be responsible for updating its state when clicked and persisting the new value of the list in the document.

```clojure
(defn list-item [id k v selections]
  (letfn [(handle-click! []
            (swap! selections update-in [k] not)
            (set-value! id (->> @selections
                                (filter second)
                                (map first))))]
    [:li {:class (str "list-group-item"
                      (if (k @selections) " active"))
          :on-click handle-click!}
      v]))
```

Let's add an instance of the `selection-list` component to our form and see how it looks.


```clojure
(defn home []
  [:div
    [:div.page-header [:h1 "Reagent Form"]]

    [text-input :first-name "First name"]
    [text-input :last-name "First name"]

    [selection-list :favorite-drinks "Favorite drinks"
     [:coffee "Coffee"]
     [:beer "Beer"]
     [:crab-juice "Crab juice"]]

    [:button {:type "submit"
              :class "btn btn-default"
              :onClick #(.log js/console (clj->js @state))}
     "Submit"]])
```

Finally, let's update our submit button to actually send the data to the server. We'll use the [cljs-ajax](https://github.com/JulianBirch/cljs-ajax) library to handle our Ajax calls. Let's add the following
dependency `[cljs-ajax "0.2.6"]` to our `project.clj` and update our namespace to reference it.

```clojure
(ns main.core
 (:require [reagent.core :as reagent :refer [atom]]
           [ajax.core :refer [POST]]))
```

With that in place we can write a `save-doc` function that will send the current state of the document to the server and set the state to saved on success.

```clojure
(defn save-doc []
  (POST (str js/context "/save")
        {:params (:doc @state)
         :handler (fn [_] (swap! state assoc :saved? true))}))
```

We can now update our form to either display a message indicating that the document has been saved or the submit button based on the value of the `:saved?` key in our state atom.


```clojure
(defn home []
  [:div
    [:div.page-header [:h1 "Reagent Form"]]

    [text-input :first-name "First name"]
    [text-input :last-name "Last name"]
    [selection-list :favorite-drinks "Favorite drinks"
     [:coffee "Coffee"]
     [:beer "Beer"]
     [:crab-juice "Crab juice"]]

   (if (:saved? @state)
     [:p "Saved"]
     [:button {:type "submit"
              :class "btn btn-default"
              :onClick save-doc}
     "Submit"])])
```

On the server side we'll simply log the value submitted by the client and return "ok".

```clojure
(ns reagent-example.routes.services
  (:use compojure.core)
  (:require [reagent-example.layout :as layout]
            [noir.response :refer [edn]]
            [clojure.pprint :refer [pprint]]))

(defn save-document [doc]
  (pprint doc)
  {:status "ok"})

(defroutes service-routes
  (POST "/save" {:keys [body-params]}
        (edn (save-document body-params))))
```

With the route hooked up in our handler we should see something like the following whenever we submit a message from our client:

```clojure
{:first-name "Jasper", :last-name "Beardly", :favorite-drinks (:coffee :beer)}
```

As you can see, getting started with Reagent is extremely easy and it requires very little code to create a working application. You could say that single page Reagent apps actually fit on a single page. :) In the next installment we'll take a look at using the [secretary](https://github.com/gf3/secretary) library to add client side routing to the application.
