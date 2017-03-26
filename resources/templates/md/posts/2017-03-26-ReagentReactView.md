{:title "Comparing Reagent to React.js and Vue.js for dynamic tabular data", :layout :post, :tags ["clojurescript" "reagent"]
 :draft? true
}

I recently ran across a [comparison of React.js to Vue.js for rendering dynamic tabular data](https://engineering.footballradar.com/a-fairer-vue-of-react-comparing-react-to-vue-for-dynamic-tabular-data-part-2/?utm_content=buffer0e901), and I got curious to see how Reagent would stack up against them.

The benchmark simulates a view of football games represented by a table. Each row in the table represents the state of a particular game. The game states are updated once a second triggering UI repaints.

I structured the application similarly to how React.js and Vue.js versions in the original benchmark. The `football.data` namespace handles the business logic, while the `football.core` handles the view.

### Implementing the Business Logic

Let's start by implementing the business logic. We'll add a new namespace called `football.data` and declare an atom to hold the state of the games:

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

You can see that we're using JavaScript interop to leverage the Faker.js library for generating the player names. One nice aspect of working with ClojureScript is that JavaScript interop is rather seamless.

Now that we have a way to generate some players, let's add a function to generate fake games:

```clojure
(defn generate-fake-game []
  {:id                 (-> js/faker .-random (.uuid))
   :clock              0
   :score              {:home 0 :away 0}
   :teams              {:home (-> js/faker .-address (.city))
                        :away (-> js/faker .-address (.city))}
   :outrageous-tackles 0
   :cards              {:yellow 0 :read 0}
   :players            (mapv generate-fake-player (range 4))})
```

With the functions to generate the players and the games in place, we'll now add a function to generate a set of initial game states:

```clojure
(defn generate-games [game-count]
  (reset! games (mapv generate-fake-game (range game-count))))
```

The next step is to write the functions to update the games and players to simulate the progression of the games:

```clojure
(defn maybe-update [game prob path f]
  (if (< (rand-int 100) prob)
    (update-in game path f)
    game))

(defn update-rand-player [game idx]
  (-> game
      (assoc-in [:players idx :effort-level] (rand-int 10))
      (assoc-in [:players idx :invited-next-week?] (> (rand) 0.5))))

(defn update-game [game]
  (-> game
      (update :clock inc)
      (maybe-update 5 [:score :home] inc)
      (maybe-update 5 [:score :away] inc)
      (maybe-update 8 [:cards :yellow] inc)
      (maybe-update 2 [:cards :red] inc)
      (maybe-update 10 [:outrageous-tackles] inc)
      (update-rand-player (rand-int 4))))
```

All we have to do is take the current state of the game, update the values, and return the new state.

The last thing we need to do is add the functions to update the game states at a specified interval. The original code uses Rx.js to accomplish this, but it's just as easy to do using the `setTimeout` function with Reagent:

```clojure
(defn update-game-at-interval [interval idx]
  (swap! games update idx update-game)
  (js/setTimeout update-game-at-interval interval interval idx))

(def event-interval 1000)

(defn update-games [game-count]
  (dotimes [i game-count]
    (swap! games update i update-game)
    (js/setTimeout #(update-game-at-interval event-interval i)
                   (* i event-interval))))
```

The `update-games` function swaps the state of each game, then sets up a timeout for the recurring updates using the `update-game-at-interval` function.

### Implementing the View

We're now ready to write the view portion of the application. We'll start by referencing the `football.data` namespace in the `football.core` namespace:

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
   [:td.u-center (:outrageous-tackles game)]
   [:td
    [:div.cards
     [:div.cards__card.cards__card--yellow (-> game :cards :yellow)]
     [:div.cards__card.cards__card--red (-> game :cards :red)]]]
   (for [player (:players game)]
     ^{:key player}
     [player-component player])])

(defn games-component []
  [:tbody
   (for [game @data/games]
     ^{:key game}
     [game-component game])])

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
```

You can see that the HTML in components are simply represented as Clojure vectors. Since s-expressions cleanly map to HTML, there's no need to use a DSL when using Reagent. You'll also notice that components can be nested within one another same way as plain HTML elements.

The `games-table-component` accepts the state of the games as a value and passes it to the `games-component` to render the rows.

Reagent atoms are reactive, and listeners are created when the atoms are dereferenced using the `@` notation. Whenever the state of the atom changes, any functions that are observing the atom will be notified of the change.

In our case, changes in the state of the `games` atom will trigger the `games-component` function to be evaluated. The function will pass the current state of the games down to its child components, and this will trigger any necessary repaints in the UI.

Finally, we have a bit of code to create the root component represented by the `home-page` function, and initialize the application:

```clojure
(defn home-page []
  [games-table-component])

(defn mount-root []
  (reagent/render [home-page] (.getElementById js/document "app")))

(def game-count 50)

(defn init! []
  (data/generate-games game-count)
  (data/update-games game-count)
  (mount-root))
```

We now have a naive implementation of the benchmark using Reagent. Next, let's take a look at how it performs.

### Profiling with Chrome

When we profile the app in Chrome, we'll see the following results:

![Reagent Results](/img/reagent-perf/reagent.png)

Here are the results for React.js and Vue.js running in the same environment for comparison:

![React.js Results](/img/reagent-perf/react.png)

![Vue.js Results](/img/reagent-perf/vue.png)

As you can see, the naive Reagent version spends about double the time scripting compared to React.js, and about four times as long rendering.

The reason is that we're dereferencing the `games` atom at top level. This forces all the child components to be reevaluated whenever the sate of any game changes.

Reagent provides a mechanism for dealing with this problem in a form of cursors. A cursor allows subscribing to changes at a specified path within a Reagent atom. A component that dereferences a cursor will only be updated when the data the cursor points to changes. This allows us to granularly control what components will be repainted when a particular piece of data changes in the `games` atom. Let's update the view logic as follows:

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
   [:td.u-center (:outrageous-tackles @game)]
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

![Reagent Results](/img/reagent-perf/reagent-cursor.png)

We can see that this makes a huge difference. The performance of the Reagent code using cursors now looks close to the Vue.js version.

### Conclusion

This benchmark shows that ClojureScript with Reagent provides a compelling alternative to JavaScript offerings such as React.js and Vue.js.

Reagent allows writing succinct solutions that perform well out of the box. It also provides us with tools to intuitively reason about what parts of the view are updated.

Likewise, we get many benefits for free simply by using ClojureScript.

We already saw that we didn't need any additional syntax, such as JSX, to represent HTML elements. In general, I find ClojureScript to have much less noise than equivalent JavaScript code.

For example, consider the implementation of the `updateGame` function in the original JavaScript version:

```javascript
function updateGame(game) {
    game = game.update("clock", (sec) => sec + 1);

    game = maybeUpdate(5, game, () => game.updateIn(["score", "home"], (s) => s + 1));
    game = maybeUpdate(5, game, () => game.updateIn(["score", "away"], (s) => s + 1));
    
    game = maybeUpdate(8, game, () => game.updateIn(["cards", "yellow"], (s) => s + 1));
    game = maybeUpdate(2, game, () => game.updateIn(["cards", "red"], (s) => s + 1));

    game = maybeUpdate(10, game, () => game.update("outrageousTackles", (t) => t + 1));

    const randomPlayerIndex = randomNum(0, 4);
    const effortLevel = randomNum();
    const invitedNextWeek = faker.random.boolean();

    game = game.updateIn(["players", randomPlayerIndex], (player) => {
        return player.set("effortLevel", effortLevel).set("invitedNextWeek", invitedNextWeek);
    });

    return game;
}
```

Now, let's compare it with the equivalent ClojureScript code:

```clojure
(defn update-rand-player [game idx]
  (-> game
      (assoc-in [:players idx :effort-level] (rand-int 10))
      (assoc-in [:players idx :invited-next-week?] (> (rand) 0.5))))

(defn update-game [game]
  (-> game
      (update :clock inc)
      (maybe-update 5 [:score :home] inc)
      (maybe-update 5 [:score :away] inc)
      (maybe-update 8 [:cards :yellow] inc)
      (maybe-update 2 [:cards :red] inc)
      (maybe-update 10 [:outrageous-tackles] inc)
      (update-rand-player (rand-int 4))))
```

ClojureScript version has a lot less syntactic noise. I find this has a direct impact on correctness. The more quirks there are in code, the more likely it is that I end up misreading the intent. Noisy syntax often results in situations where code looks like it's doing one thing, while it's actually doing something different.

Another advantage is that ClojureScript is backed by immutable data structures by default. Since immutability is pervasive as opposed to opt-in, it allows for tooling to be designed with it in mind. For example, [Figwheel](https://github.com/bhauman/lein-figwheel) plugin relies on this to provide live hot reloading in the browser.

Finally, ClojureScript compiler can do many optimizations, such as [dead code elimination](http://swannodette.github.io/2015/01/06/the-false-promise-of-javascript-microlibs), that are difficult to do with JavaScript.