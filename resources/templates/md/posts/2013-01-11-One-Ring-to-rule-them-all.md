{:title "One Ring to rule them all",
 :layout :post,
 :tags ["clojure" "luminus"]}

The latest release of [Luminus](http://www.luminusweb.net/) is no longer using a custom `server.clj` which starts up Jetty using `run-jetty`. Instead, it now relies on [lein-ring](https://github.com/weavejester/lein-ring), which in turns uses [ring-server](https://github.com/weavejester/ring-server) to create the server.

Snice you no longer have a `-main` in the project, you can't use `lein run` to start it up for development. Instead, use `lein ring server`, which will run Jetty for you.

If you need to start the server from within a REPL, then you can use the new `repl` namespace, which provides `start-server` and `stop-server` functions.

When you're packaging the application as a standalone, you run would now run `lein ring uberjar` instead of `lein uberjar`. The `-main` will be created by `lein-ring` for you based on the handler specified in your `project.clj`.

This means that all the configuration now lives under `project.clj` and gets picked up consistently both in development and production modes.

The new changes also simplify Heroku deployment. You no longer need to specify `+heroku`, the application will have all the necessary settings to run on Heroku out of the box.

Finally, I dropped support for Leiningen 1.x as it doesn't have support for profiles. There's no good reason to continue using it instead of upgrading to 2.x.



