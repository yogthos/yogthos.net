{:title "ClojureScript Adventures",
 :layout :post,
 :tags ["clojure" "clojurescript"]}

I finally got a chance to play around a bit more with ClojureScript. When I was updating [markdown-clj](https://github.com/yogthos/markdown-clj) to compile to it, the extent of interaction was to accept a markdown string and return the corresponding HTML.

This time around I decided to dive into doing interop with JavaScript and actual interaction with the page. I wrote a silly [Tetris game](https://github.com/yogthos/Clojure-Tetris) a while back, and it seemed like a perfect fit for the task.

So, let's see what's involved in porting Clojure to ClojureScript and Canvas. First, I had to separate the pure Clojure code from any code which relies on Java interop. The original code can be seen [here](https://github.com/yogthos/Clojure-Tetris/blob/f614a66524647870bc387ca9615a119bc7d76a36/src/tetris.clj).

After, splitting it up, I ended up with a [game namespace](https://github.com/yogthos/Clojure-Tetris/blob/master/src/tetris/game.clj) which contains the bulk of the game logic, and a [core namespace](https://github.com/yogthos/Clojure-Tetris/blob/master/src/tetris/core.clj) containing all the logic pertaining to the UI and input. The split turned out to be fairly painless since I already had the game logic separated from UI in the original design.

Now it's time to add some ClojureScript to the project. First, we need to create a new source folder for the ClojureScript namespaces. In my project I called this folder `src-cljs`. Then we need some way to compile our script.

The easiest way to do that is to use the [lein-cljsbuild plugin](https://github.com/emezeske/lein-cljsbuild). With it you can specify the ClojureScript sources, Clojure namespaces you'd like to reference, and the output Js files to produce.

In my case the project file looks as follows:

```clojure
(defproject tetris "0.1.0-SNAPSHOT"
  :description "a simple Tetris game"
  :url "https://github.com/yogthos/Clojure-Tetris"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  
  :dependencies [[org.clojure/clojure "1.4.0"]]
  :plugins [[lein-cljsbuild "0.2.9"]]
  
  :source-paths ["src"]
  :main tetris.core

  :cljsbuild {:crossovers [tetris.game]
              :builds
              [{:source-path "src-cljs"
                :compiler
                {:output-to "js/tetris.js"
                 :optimizations :advanced
                 :pretty-print false}}]})
```

All that's needed to include ClojureScript compilation is to add the `lein-cljsbuild` in the plugins and specify the options for the `cljsbuild`. The `crossovers` section specifies a vector of Clojure namespaces which will be included during compilation.

Once the project file is setup, we have two options for invoking ClojureScript compilation. We can either run `lein cljsbuild once` or `lein cljsbuild auto`. When using the auto option, the build will watch for changes in the source and automatically recompile the Js files as needed. This takes much less time than when compiling using the once option, and turns out to be quite handy for development.

The ClojureScript version of the UI, which uses the canvas, can be seen [here](https://github.com/yogthos/Clojure-Tetris/blob/master/src-cljs/tetris/core.cljs) . 

Interacting with JavaScript turns out to be pretty simple and the syntax is similar to Java interop in Clojure. However, there are some differences  which are worth mentioning.

Any standard Js functions can be accessed using the `js` namespace, for example if we want to make a logger which logs to the console we can write something like the following:

```clojure
(defn log [& items]
  (.log js/console (apply str items)))
```
This works exactly like the Java interop, where we denote methods by using the `.` notation and pass in the object as the first argument.

Exporting functions so that they're visible from JavaScript is also quite simple. Instead of denoting them with `-` as we do when we interop with Java, we use `^:export` annotation:

```clojure
(defn ^:export init []
  (log "Hello ClojureScript!"))
```

One thing that's not obvious is the interaction with JavaScript object properties. To access these we use `(.-property obj)` notation. Where `-` indicates that we're referencing a property and not a function. Writing properties is accomplished by calling the `set!` function. Here's an example:

```clojure
(defn ^:export init []
  (let [canvas (.getElementById js/document "canvas")
        ctx    (.getContext canvas "2d")
        width  (.-width canvas) 
        height (.-height canvas)]
 
    (log "width: " width ", height: " height)

    ;;set a property
    (set! (.-fillStyle ctx) "black")

    (.fillRect ctx 0 0 width height)))
```
Another quirk I ran into is that `:use` doesn't seem to work in the namespace declaration as it expects a collection.

For example, if you have the following setup:
```clojure
(ns foo)

(defn bar [])

(ns hello
 (:use foo))

(defn ^:export init []
	(js/alert "Hello from ClojureScript!"))
```

the compiler throws the following error:
```clojure
java.lang.UnsupportedOperationException: nth not supported on this type: Symbol
```
Fortunately, both `(:use [foo :only [bar]])` and `(:require foo)` work as expected. 

Finally, to make a timer, it's possible to use `js/setTimeout` and simply pass it the function to call after the timeout:

```clojure
(declare game-loop)
(defn game-loop [state]
  (if (not (:game-over state))
    (js/setTimeout
      (fn [] (game-loop (update-state state)))
      10)))     
```

Everything else appeared to work exactly as it does in Clojure itself. The only caveat when porting code is that it cannot contain any Java interop or use libraries which do so. In case of the game, I simply put the game logic into a shared namespace and wrote separate UI logic for both Java and JavaScript versions.

To try out the ClojureScript version simply grab [tetris.js](https://raw.github.com/yogthos/Clojure-Tetris/master/js/tetris.js) and [tetris.html](https://raw.github.com/yogthos/Clojure-Tetris/master/tetris.html) which expects the tetris.js file to be in the `js` folder relative to it. 

One thing to note is that ClojureScript is definitely chunky compared to writing JavaScript by hand. The game weighs in at a hefty 100k. That said, it should be noted that jQuery weighs in about that as well, and nobody would claim that it's outrageous for a site to include it. 

I feel that the benefits of ClojureScript offers far outweigh the downsides of its size. You get a much nicer language without all the quirks of working in JavaScript, immutability, persistent data structures, and the ability to easily share code between the server and the browser.

The good news is that ClojureScript is under active development, and performance and size are both targets for future improvement. As it stands I find it very usable for many situations.

