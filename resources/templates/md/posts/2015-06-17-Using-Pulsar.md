{:title "Using Pulsar", :layout :post, :tags ["clojure"]}

In this post, we'll take a look at a basic usage example for Pulsar and see how to package it for production.

### What is Pulsar?

[Pulsar](http://docs.paralleluniverse.co/pulsar/) is the official Clojure API for the [Quasar](http://www.paralleluniverse.co/quasar/) library that provides lightweight green threads and Erlang style actors for the JVM.

Quasar has a lot of similarities to the popular [Akka framewok](http://akka.io/), but has the advantage of being a library as opposed to a framework that imposes its own workflow. For those interested, a detailed comparison of Quasar and Akka is availble [here](http://blog.paralleluniverse.co/2015/05/21/quasar-vs-akka/).

Using Pulsar is very straight forward, however there are a few caveats to be aware of when it comes to packaging it for production. Quasar requires bytecode instrumentation in order to provide suspendanble functions, and this means that the `project.clj` needs to have additional hints to facilitate it. 

### Creating the Project

Let's start by creating a new project called `pulsar-example`:

```
lein new pulsar-example
```

Next, we'll add the following dependencies to the `project.clj` file:

```clojure
[co.paralleluniverse/pulsar "0.7.2"]
[co.paralleluniverse/quasar-core "0.7.2"]
```

We'll also have to add a `:java-agents` key that will invoke the Quasar agent responsible for the instrumentation:

```clojure
:java-agents [[co.paralleluniverse/quasar-core "0.7.2"]]
```

### Adding Actors

Let's open up the `pulsar-example.core` namespace and update the `ns` declaration as follows:

```clojure
(ns pulsar-example.core
  (:require
   [co.paralleluniverse.pulsar
    [core :refer :all]
    [actors :refer :all]])
  (:refer-clojure :exclude [promise await])
  (:gen-class))
```

We'll implement [one of the official examples](https://github.com/puniverse/pulsar/blob/master/src/test/clojure/co/paralleluniverse/pulsar/examples/pingpong.clj) where two actors send messages to one another. In the example we have two functions called `ping` and `pong`. These are defined using the `defsfn` macro as opposed to regular `defn`. This is necessary in order for these functions to be suspendable.

The `ping` function will accept two parameters consisting of the number representing remaining iterations and the actor to send messages to.

The function checks if there are remaining iterations and notfies `pong` that the conversation is complete when `n` is zero. Otherwise, it sends a ping message to the `pong` actor and waits to receive an acknowledgement before recurring. As you may have guessed, the `receive` call will block until a message is received.

The `@self` notation is used to access the actor itself. This is needed to pass it to the other actor as part of the message in order to receive a response.

```clojure
(defsfn ping [n pong]
  (if (== n 0)
    (do
      (! pong :finished)
      (println "ping finished"))
    (do
      (! pong [:ping @self])
      (receive
        :pong (println "Ping received pong"))
      (recur (dec n) pong))))
```

Meanwhile, the `pong` function will wait to receive a message, if the message is `:finished` then it finishes its run, and if it matches `[:ping ping]` then it will return the message `:ping` to the caller and recur:

```clojure
(defsfn pong []
  (receive
    :finished (println "Pong finished")
    [:ping ping] (do
                   (println "Pong received ping")
                   (! ping :pong)
                   (recur))))
```

Note that the message can either be a keyword or a vector containing the parameters we wish to pass to the actor. Finally, we'll add a `-main` function as the entry point to our program. Note that we `join` our actors to ensure that the application keeps running until the actors exit.

```clojure
(defn -main []
  (let [a1 (spawn pong)
        b1 (spawn ping 3 a1)]
    (join a1)
    (join b1)
    :ok))
```

We can now test that everything is working by running it from the REPL or using `lein run`.

### Packaging for Deployment

Once we're ready to package our app for deployment we need to make sure that the Quasar agent can be run to instrument our suspendable functions. To do that we'll have to add a `:manifest` key to our project that points to the following configuration:

```clojure
:manifest
 {"Premain-Class" "co.paralleluniverse.fibers.instrument.JavaAgent"
  "Agent-Class" "co.paralleluniverse.fibers.instrument.JavaAgent"
  "Can-Retransform-Classes" "true"
  "Can-Redefine-Classes" "true"}
```

This will be written out to the `META-INF/MANIFEST.MF` file in the jar and provide the necessary information about the agent. The project can now be packaged by running `lein uberjar`. One final thing to be aware of is that the resulting jar must be run with the `-javaagent` flag as follows:

```
java -javaagent:target/pulsar-example.jar -jar target/pulsar-example.jar
```

This is all that needs to be done in order to package and run Pulsar projects using Leiningen. As always, the complete source for the example is available [on GitHub](https://github.com/yogthos/pulsar-example).

