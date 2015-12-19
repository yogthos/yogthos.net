{:title "Using ClojureScript REPL from Light Table",
 :layout :post,
 :tags ["clojurescript"]}

I recently discovered that [Light Table](http://www.lighttable.com/) REPL works with ClojureScript without the need for any specific setup in your project.  All you need is the [lein-cljsbuild](https://github.com/emezeske/lein-cljsbuild) plugin to run the incremental compiler and follow the steps below:

1. start the ClojureScript compiler using `lein cljsbuild auto`
1. start the server using `lein ring server`
2. open the Light Table browser connection to the server
3. navigate to a ClojureScript namespace in your project and start evaluating expressions

I tried other ClojureScript REPL setups before and I always found the process extremely fiddly, with Light Table everything just worked out of the box. I definitely recommend giving it a shot if you haven't yet, especially if you're working with ClojureScript.