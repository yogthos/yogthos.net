{:title "Packaging a Clojure+ClojureScript jar",
 :layout :post,
 :tags ["clojure" "clojurescript"]}

I maintain a Clojure Markdown parser library called [markdown-clj](https://github.com/yogthos/markdown-clj). I originally wrote it because I was curious to see just how concise a Clojure Markdown parser would be. Turns out that it's pretty concise. :)

Then I saw [a post](http://briancarper.net/blog/415/clojure-and-markdown-and-javascript-and-java-and) from Brian Carper that highlighted a problem with having different Markdown parsers on the client and the server.

Since Markdown specification is somewhat loose, most implementations interpret it differently. This means that if you're rendering a preview on the client using a JavaScript library and using a different library, such as [pegdown](https://github.com/sirthias/pegdown), to render it on the server you may get some surprises.

Since my library was already written in pure Clojure I figured it wouldn't be difficult to cross-compile it to ClojureScript as well.

That turned out to be very easy to do. I split out the element transformers into a separate namespace that's shared between Clojure and ClojureScript cores. However, for the longest time I only packaged it for distribution as a Clojure library.

I finally had a bit of free time to look at ClojureScript packaging over the weekend and I'm happy to report that the dependency now works for both Clojure and ClojureScript out of the box.

While pure ClojureScript libraries compile without any extra work, I found a few gotchas that are specific to cross-compiling. 

If you have a project that contains both Clojure and ClojureScript code in it, then **only** the `clj` files will be packaged in the jar by default. After some reading of the [lein-cljsbuild](https://github.com/emezeske/lein-cljsbuild) docs I found the solution. 

Here's what I ended up doing to get `cljs` namespaces to be packaged along with the `clj` namespaces:

```clojure
:cljsbuild
{:crossovers [markdown.transformers]
  :crossover-path "crossover"
  :crossover-jar true        
  :builds {:main
           {:source-paths ["src-cljs"]
            :jar true
            :compiler {:output-to "js/markdown.js"
                       :optimizations :advanced
                       :pretty-print false}}
           :dev 
           {:compiler {:optimizations :whitespace
                       :pretty-print true}}}}
```

I specify the `:crossover-path`, note that this path has to be different from your `:source-paths` or the files there will be overwritten.

Next, I added the `:corssover-jar true` to indicate that I wish the crossover namespaces to appear in the resulting jar.

I also added `:jar true` to the `:main` section of the `:builds`. This is needed to include the namespaces in the `src-cljs` source directory.

Finally, you also need to include `:clojurescript? true` in `project.clj` to indicate that the project contains ClojureScript sources. Here's the complete project file that I'm using:

```clojure
(defproject markdown-clj "0.9.25"
  :clojurescript? true
  :description "Markdown parser"
   :url "https://github.com/yogthos/markdown-clj"
   :license {:name "Eclipse Public License"
             :url "http://www.eclipse.org/legal/epl-v10.html"}
   :dependencies [[org.clojure/clojure "1.5.1"]
                  [criterium "0.3.1" :scope "test"]]
   :plugins [[lein-cljsbuild "0.3.2"]]
   :hooks [leiningen.cljsbuild]
   :test-selectors {:default (complement :benchmark)
                    :benchmark :benchmark
                    :all (constantly true)}
   
   :cljsbuild
   {:crossovers [markdown.transformers]
    :crossover-path "crossover"
    :crossover-jar true        
    :builds {:main
             {:source-paths ["src-cljs"]
              :jar true
              :compiler {:output-to "js/markdown.js"
                         :optimizations :advanced
                         :pretty-print false}}
             :dev 
             {:compiler {:optimizations :whitespace
                         :pretty-print true}}}})
```
The resulting jar will contain all your `clj` and `cljs` files along with the crossover namespaces.

For me, being able to manage dependencies using Leiningen is a definite killer feature when it comes to ClojureScript.