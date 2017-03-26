{:title "Comparing Reagent to React.js to Vue.js for dynamic tabular data", :layout :post, :tags ["clojurescript" "reagent"]
 :draft? true
}

I recently ran across a [comparison of React.js to Vue.js for rendering dynamic tabular data](https://engineering.footballradar.com/a-fairer-vue-of-react-comparing-react-to-vue-for-dynamic-tabular-data-part-2/?utm_content=buffer0e901), and I got curious to see how Reagent would stack up against them.

The benchmark simulates a view of football games represented by a table. Each row in the table represents the state of a particular game. The game states are updated once a second triggering UI repaints.

I structured the application similarly to how React.js and Vue.js versions in the original benchmark. The `football.data` namespace handles the business logic, while the `football.core` handles the view.

We start by implementing the business logic. We'll add a new namespace called `football.data` and declare an atom to hold the state of the games:

```clojure
(ns football.data
  (:require [reagent.core :as reagent]))

(defonce games (reagent/atom nil))
```

Next, we'll add a function to generate the fake players:

```clojure
(defn generate-fake-player []
  {:name               (-> js/faker .-name (.findName))
   :effort-level       (rand-int 10)
   :invited-next-week? (> (rand) 0.5)})
```

You can see that we're using JavaScript interop to leverage the Faker.js library for generating the player names. One nice aspect of working with ClojureScript is that it's trivial to leverage existing JavaScript libraries in your code.

Now that we have a way to generate some players, let's add a function to generate fake games:

```clojure
(defn generate-fake-game []
  {:id                (-> js/faker .-random (.uuid))
   :clock             0
   :score             {:home 0 :away 0}
   :teams             {:home (-> js/faker .-address (.city))
                       :away (-> js/faker .-address (.city))}
   :outrageous-ackles 0
   :cards             {:yellow 0 :read 0}
   :players           (mapv generate-fake-player (range 4))})
```

With the functions to generate the players and the games in place, we'll now add a function to generate a set of initial game states:

```clojure
(defn generate-games [game-count]
  (reset! games (mapv generate-fake-game (range game-count))))
```

The next step is to write the functions to update the games and players:

```clojure
(defn maybe-update [game prob path f]
  (if (< (rand-int 100) prob)
    (update-in game path f)
    game))

(defn update-rand-player [game idx]
  (-> game
      (assoc-in [:players idx :effort-level] (rand-int 10))
      (assoc-in [:players idx :invited-next-week?] (> (rand) 0.5))))

(defn update-games []
  (swap! games
         #(mapv
            (fn [game]
              (-> game
                  (update :clock inc)
                  (maybe-update 5 [:score :home] inc)
                  (maybe-update 5 [:score :away] inc)
                  (maybe-update 8 [:cards :yellow] inc)
                  (maybe-update 2 [:cards :red] inc)
                  (maybe-update 10 [:outrageous-ackles] inc)
                  (update-rand-player (rand-int 4))))
            %))
  (js/setTimeout update-games 1000))
```

All we have to do is take the current state of the games and set the new values for each game. The `update-games` function calls itself with using `setTimeout` at one second intervals to continuously generate new game states.

The code weighs in at about half the of either Vue.js or React.js versions. Not only that, but we also get immutability for free with the ClojureScript version.

We're now ready to write the view portion of the application. We'll start by referencing the `football.data` namespace in our `football.core` namespace:

```clojure
(ns football.core
  (:require
    [football.data :as data]
    [reagent.core :as reagent]))
```

Next, we'll write the components to display the players and the games:

```clojure
(defn player-component [{:keys [name invited-next-week? effort-level]}]
  [:td
   [:div.player
    [:p.player__name
     [:span name]
     [:span.u-small (if invited-next-week? "Doing well" "Not coming again")]]
    [:div {:class-name (str "player__effort "
                            (if (< effort-level 5)
                              "player__effort--low"
                              "player__effort--high"))}]]])

(defn game-component [game]
  [:tr
   [:td.u-center (:clock game)]
   [:td.u-center (-> game :score :home) "-" (-> game :score :away)]
   [:td.cell--teams (-> game :teams :home) "-" (-> game :teams :away)]
   [:td.u-center (:outrageous-ackles game)]
   [:td
    [:div.cards
     [:div.cards__card.cards__card--yellow (-> game :cards :yellow)]
     [:div.cards__card.cards__card--red (-> game :cards :red)]]]
   (for [player (:players game)]
     ^{:key player}
     [player-component player])])

(defn games-component [games]
  [:tbody
   (for [game games]
     ^{:key game}
     [game-component game])])

(defn games-table-component [games]
  [:table
   [:thead
    [:tr
     [:th {:width "50px"} "Clock"]
     [:th {:width "50px"} "Score"]
     [:th {:width "200px"} "Teams"]
     [:th "Outrageous Tackles"]
     [:th {:width "100px"} "Cards"]
     [:th {:width "100px"} "Players"]
     [:th {:width "100px"} ""]
     [:th {:width "100px"} ""]
     [:th {:width "100px"} ""]
     [:th {:width "100px"} ""]]]
   [games-component games]])  
```

You can see that the HTML in components is simply represented as Clojure vectors and maps. Since s-expressions cleanly map to HTML, there's no need to use a DSL to represent it in Reagent. You'll also notice that components can be nested within one another same way as plain HTML elements.

The `games-table-component` accepts the state of the games as a value and passes it to the `games-component` to render the rows.

The `home-page` component is the entry point for the UI, and it instantiates the `games-table-component` using the state of the `football.data/games` atom:

```clojure
(defn home-page []
  [games-table-component @data/games])
```

Reagent atoms are reactive, and listeners are created when the atoms are dereferenced using the `@` notation. Whenever the state of the atom changes, any functions that are observing the atom will be notified of the change.

In our case, changes in the state of the `games` atom will trigger the `home-page` function to be evaluated. The function will pass the current state of the games down to its child components, and this will trigger any necessary repaints in the UI.

Once again, we have about half the code to render the UI, and we didn't need any additional syntax, such as JSX, to represent HTML elements.

### Benchmarking

When we profile the app in Chrome, we'll see the following results:

![]() <- screenshot

Here are the results for React.js and Vue.js running in the same environment for comparison:

![]() <- screenshot

As you can see, the naive Reagent version does well in all categories, except for render. Rendering takes nearly 4 times as long as React.js.

The reason is that when we dereference the whole `games` atom at top level, it forces all the child components to repaint whenever the sate of any game changes.

Reagent provides a mechanism specifically for dealing with this problem. A cursor allows subscribing to changes at a specified path within an atom. This allows us to granularly control what components will be repainted.

Let's update the view logic as follows:

```clojure
(defn player-component [player]
  [:td
   [:div.player
    [:p.player__name
     [:span (:name @player)]
     [:span.u-small (if (:invited-next-week? @player) "Doing well" "Not coming again")]]
    [:div {:class-name (str "player__effort "
                            (if (< (:effort-level @player) 5)
                              "player__effort--low"
                              "player__effort--high"))}]]])

(defn game-component [game]
  [:tr
   [:td.u-center (:clock @game)]
   [:td.u-center (-> @game :score :home) "-" (-> @game :score :away)]
   [:td.cell--teams (-> @game :teams :home) "-" (-> @game :teams :away)]
   [:td.u-center (:outrageous-ackles @game)]
   [:td
    [:div.cards
     [:div.cards__card.cards__card--yellow (-> @game :cards :yellow)]
     [:div.cards__card.cards__card--red (-> @game :cards :red)]]]
   (for [idx (range (count (:players @game)))]
     ^{:key idx}
     [player-component (reagent/cursor game [:players idx])])])

(defn games-component []
  [:tbody
   (for [idx (range game-count)]
     ^{:key idx}
     [game-component (reagent/cursor data/games [idx])])])

(defn games-table-component []
  [:table
   [:thead
    [:tr
     [:th {:width "50px"} "Clock"]
     [:th {:width "50px"} "Score"]
     [:th {:width "200px"} "Teams"]
     [:th "Outrageous Tackles"]
     [:th {:width "100px"} "Cards"]
     [:th {:width "100px"} "Players"]
     [:th {:width "100px"} ""]
     [:th {:width "100px"} ""]
     [:th {:width "100px"} ""]
     [:th {:width "100px"} ""]]]
   [games-component]])

(defn home-page []
  [games-table-component])
```

The above version creates a cursor for each game in the `games-components`. The `game-component` in turn creates a cursor for each player. This way only the components that actually need updating end up being rendered as the state of the games is updated. Let's run the benchmark again to see how much impact this has on performance:

![]() <-- screenshot

We can see that this makes a huge difference. We're now spending roughly half the time of React.js in every category. 

### Conclusion

This benchmark shows that ClojureScript with Reagent provides a compelling alternative to JavaScript offerings such as React.js and Vue.js.

Reagent allows writing succinct solutions that perform well out of the box. It also provides us with tools to intuitively do significant optimizations.