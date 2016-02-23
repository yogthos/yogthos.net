{:title "Routing With Secretary",
 :layout :post,
 :tags ["reagent" "clojurescript"]}

In the last post, we looked at using Reagent for building single page apps.
The [example](https://github.com/yogthos/reagent-example) app contained a single page with a form in it, which isn't terribly exciting as far as single page apps go.

In this post we’ll see see how to create an app with multiple pages and how we can route between them using the [secretary](https://github.com/gf3/secretary) library.

The app will be a guestbook with a page that shows a list of users and another page that allows new users to sign in. We’ll use the project from the last post as the base for this tutorial.

***update*** the tutorial has been updated to the latest version of Luminus, you'll need to create a new project to follow along using `lein new luminus guestbook +cljs`

First thing that we have to do is to add the `[secretary "1.2.3"]` dependency to our `project.clj`. Next, let’s refactor our namespaces in `src/cljs` as follows:

```
src
  └ cljs
    └ guestbook
      └ core.cljs
      └ pages
        └ guest.cljs
        └ guest_list.cljs
```

* The `core` namespace will act as the entry point for the client.
* The `session` will house the global state of the application.
* The `guest` namespace will house the sign-in form.
* The `guest-list` namespace will display the guests.

Since we refactored the namespaces we’ll also need to update our `app.html` template to reflect that.

```xml
<script type="text/javascript">goog.require("guestbook.core");</script>
```

### Session Management

In our example, the session will track the currently selected page and the saved documents.

We’ll use the [reagent-utils](https://github.com/reagent-project/reagent-utils/blob/master/src/reagent/session.cljs) session. The session is simply a Ragent atom
with some helper functions around it.


### Listing Guests

Let’s open up the `guest-list` namespace and add the following code there.

```clojure
(ns guestbook.pages.guest-list
  (:require [reagent.session :as session]
            [clojure.string :as s]
            [reagent.core :as reagent :refer [atom]]
            [secretary.core :refer [dispatch!]]))

(defn guest-list-page []
  [:div
   [:div.page-header [:h2 "Guests"]]
   (for [{:keys [first-name last-name]}
         (session/get :guests)]
     [:div.row
      [:p first-name " " last-name]])
   [:button {:type "submit"
             :class "btn btn-default"
             :on-click #(dispatch! "/sign-in")}
    "sign in"]])
```

The namespace will contain a page that lists the guests that are currently in the session. The `“sign in”` button on the page uses the `dispatch!` function in order to route to the `“/sign-in”` page.

### Adding Routes

The `core` namespace will specify the list of routes and provide an `init!` function to set the current page and render it when the application loads.

```clojure
(ns guestbook.core
  (:require [reagent.core :as r]
            [reagent.session :as session]
            [secretary.core :as secretary :include-macros true]
            [goog.events :as events]
            [goog.history.EventType :as HistoryEventType]
            [guestbook.ajax :refer [load-interceptors!]]
            [guestbook.pages.guest-list
            :refer [guest-list-page]]
           [guestbook.pages.guest :refer [guest-page]])
  (:import goog.History))

(defn page []
  [(session/get :current-page)])

;; -------------------------
;; Routes
(secretary/set-config! :prefix "#")

(secretary/defroute "/" []
  (session/put! :current-page guest-list-page))

(secretary/defroute "/sign-in" []
  (session/put! :current-page guest-page))

;; -------------------------
;; History
;; must be called after routes have been defined
(defn hook-browser-navigation! []
  (doto (History.)
        (events/listen
          HistoryEventType/NAVIGATE
          (fn [event]
              (secretary/dispatch! (.-token event))))
        (.setEnabled true)))

;; -------------------------
;; Initialize app
(defn mount-components []
  (r/render [#'page] (.getElementById js/document "app")))

(defn init! []
  (load-interceptors!)
  (hook-browser-navigation!)
  (mount-components))
```

As we can see above, `secretary` uses Compojure inspired syntax that should look very familiar to anybody who's dabbled in Clojure web development.

In our case the routes will simply set the appropriate page in the session when called. The `render` function will then be triggered by the atom update and render the page for us.

### Signing In

Finally, we’ll add the sign-in form in the `guest` namespace. The page will keep its local state in an atom and update the session using the callback handler in the `save-doc` function.

Note that we don’t have to do anything else to update the list of guests once the callback completes. Since the session atom has been updated, it will trigger the guest list to repaint with the new elements.

I found that this behavior largely obviates the need to use `core.async` since the Reagent atom can act as a sync point between the view and the model. It also makes it trivial to implements the [React Flux](http://facebook.github.io/react/docs/flux-overview.html) pattern.

```
Views--->(actions) --> Dispatcher-->(callback)--> Stores---+
Ʌ                                                          |
|                                                          V
+--(event handlers update)--(Stores emit "change" events)--+
```

Our view components dispatch updates to the atoms, which represent the stores. The atoms in turn notify any components that dereference them when their state changes.

Using `get/set!` functions to access the atoms, as we’re doing in this example, allows us to easily listen for changes and hook in event handlers.

```clojure
(ns guestbook.pages.guest
  (:refer-clojure :exclude [get])
  (:require [reagent.session :as session]
            [reagent.core :as reagent :refer [atom]]
            [secretary.core :refer [dispatch!]]
            [ajax.core :refer [POST]]))

(defn put! [doc id value]
  (swap! doc assoc :saved? false id value))

(defn get [doc id]
  (id @doc))

(defn row [label & body]
  [:div.row
   [:div.col-md-2 [:span label]]
   [:div.col-md-3 body]])

(defn text-input [doc id label]
  [row label
   [:input {:type "text"
            :class "form-control"
            :value (get doc id)
            :onChange #(put! doc id (-> % .-target .-value))}]])

(defn save-doc [doc]
  (POST "/save"
        {:params (dissoc @doc :saved?)
         :handler
         (fn [_]
           (put! doc :saved? true)
           (session/update-in! [:guests] conj @doc)
           (dispatch! "/"))}))

(defn guest-page []
  (let [doc (atom {})]
    (fn []
      [:div
       [:div.page-header [:h1 "Sign In"]]

       [text-input doc :first-name "First name"]
       [text-input doc :last-name "Last name"]

       (if (get doc :saved?)
         [:p "Saved"]
         [:button {:type "submit"
                   :class "btn btn-default"
                   :on-click #(save-doc doc)}
          "Submit"])
       [:button {:type "submit"
                 :class "btn btn-default"
                 :on-click #(dispatch! "/")} "back"]])))
```
The form code on this page is based on the [previous tutorial](http://yogthos.net/#/blog/54) and should hopefully be self explanatory at this point.

### Hooking in Browser Navigation

As a final touch, we can add support for managing history using `goog.events` to enable more intelligent navigation using the browser.

```clojure
(ns guestbook.core
 (:require [reagent.session :as session]
           [guestbook.pages.guest-list
            :refer [guest-list-page]]
           [guestbook.pages.guest :refer [guest-page]]
           [reagent.core :as reagent :refer [atom]]
           [secretary.core :as secretary
             :include-macros true :refer [defroute]]
           [goog.events :as events]
           [goog.history.EventType :as EventType]))

(defn hook-browser-navigation! []
  (doto (History.)
    (events/listen
      EventType/NAVIGATE
      (fn [event]
        (secretary/dispatch! (.-token event))))
    (.setEnabled true)))

```

The function is then run by the `init!` function when the app loads:

```clojure
(defn init! []
  (load-interceptors!)
  (hook-browser-navigation!)
  (mount-components))
```

As usual, the source for the project can be found [here](https://github.com/yogthos/reagent-secretary-example).

### Final Thoughts

The example in this post is intentionally kept trivial, but hopefully it illustrates a simple way to hook up multiple pages and navigate between them using Reagent and secretary.

I recently rewrote this blog engine to use Reagent and I found that it made the code much cleaner and easier to maintain. I think one of the main benefits of the single page approach is that it enforces a clear separation between the server and the client portions of the application.

If you’d like to see a complete application built using the approach discussed here, don’t hesitate to take a look at the [code](https://github.com/yogthos/yuggoth) behind this blog.


