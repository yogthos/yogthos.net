{:title "The State of Reagent",
 :layout :post,
 :tags ["reagent" "clojurescript"]}

I'm happy to report that Dan Holmsand has graciously agreed to move [Reagent](https://github.com/reagent-project/reagent) to a GitHub Organization called the [reagent-project](https://github.com/reagent-project).
The organization will help spread the work as well as provide a hub for all the related projects.
There has been a lot of recent interest in the org and several projects have already migrated under the umbrella.

First, I'd like to mention the [reagent-cookbook](https://github.com/reagent-project/reagent-cookbook) project that provides many recipes for accomplishing common tasks,
such as Js library integration, using Reagent. The project provides clear and simple guidelines for contributing to help ensure that all recipes have a common format that's easy to follow.
Next addition is the [Historian](https://github.com/reagent-project/historian) project that provides drop-in
undo/redo functionality for Reagent. World Singles has recently [switched from Om to Reagent](https://groups.google.com/forum/#!msg/clojurescript/r9B1k4MoTXA/J5gdZBa-BwUJ) and Sean Corfield has added [reagent-cursor](https://github.com/reagent-project/reagent-cursor) library for Om-like cursor support in the process. Finally, there is my own [reagent-forms](https://github.com/reagent-project/reagent-forms) library for creating data bindings using Reagent.

New Reagent projects can now be easily created and run using the [reagent-template](https://github.com/reagent-project/reagent-template) as follows:

```
lein new reagent my-app
cd my-app
lein cljsbuild auto &
lein ring server
```



The template will generate a Clojure/Clojurescript web app that's designed to get you up and running without
any tedious setup.
The resulting project is setup to use [Figwheel](https://github.com/bhauman/lein-figwheel) for live code reloading and [weasel](https://github.com/tomjakubowski/weasel) for the REPL enabling smooth development out of the box.

The template uses sane library and configuration choices across the stack with Reagent for the UI, [Secretary](https://github.com/gf3/secretary) for client side routing, and the Ring/Compojure stack on the backend.

The dev server and packaging are handled by [lein-ring](https://github.com/weavejester/lein-ring) that will
take care of reloading changes during development and producing either an uberjar or an uberwar for running standalone or deploying to a container respectively. The project also contains a `Procfile` for instant Heroku deployment. For more details, please visit the project page [here](https://github.com/reagent-project/reagent-template).

As you can see, much has happened with Reagent in the past month and the future is looking very bright. If you haven't tried Reagent yet, there's never been a better time than now. :)

