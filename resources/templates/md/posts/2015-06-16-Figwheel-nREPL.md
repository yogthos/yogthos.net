{:title "ClojureScript REPL with Figwheel"
 :layout :post
 :tags ["clojurescript"]}

Figwheel provides a fantastic developer experience and if you're not
using it already I highly encourage you to give it a shot. I found that
in most cases live code reloading is sufficient for my workflow, but
there are occasions where I do want to have an actual REPL available.

This mostly comes up when I'm working with code that's not directly tied
to rendering UI components and it can quickly devolve into `println`
debugging.

You probably noticed that Figwheel starts a REPL in the terminal when it runs.
However, this REPL is not terribly useful in practice. What would be better is
to have a REPL that's connected to the editor, such as Cursive or Emacs, so
that you can evaluate the code you're working on the same way you would with Clojure.

Luckily, getting this to work turns out to be a pretty simple affair.
First thing we need to do is to make sure that the Figwheel config in
`project.clj` has the `:nrepl-port` key set as seen below:

```clojure
:figwheel
{:http-server-root "public"
 :server-port 3449
 :nrepl-port 7002 ;;start nREPL on port 7002
 :css-dirs ["resources/public/css"]
 :ring-handler yourapp/handler}
```

When you run `lein figwheel` the nREPL server will become available and
you can connect your editor to it at `localhost:7002`, or whatever port you've
specifcied. Once the nREPL is connected you'll have to run the following commands there:

```clojure
user> (use 'figwheel-sidecar.repl-api)
user> (cljs-repl)
```

You should see the Figwheel REPL start up the same way it did when you ran
`lein figwheel` in the terminal. You should now be able to send any code from the editor
to the REPL for evaluation.
