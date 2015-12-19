{:title "Setting up Eclipse for Clojure",
 :layout :post,
 :tags ["clojure"]}

The [Results of the 2012 State of Clojure survey](http://cemerick.com/2012/08/06/results-of-the-2012-state-of-clojure-survey/) are out, and they look very exciting indeed. More people are using Clojure, the community is growing, and for the most part things appear to be progressing well. However, one notable problem that people are reporting is actually getting started with Clojure.

I'd like to spend some time here to help people actually get up and running with the language. First, I'll cover setting up the development environment. Many Clojure users gravitate towards Emacs, which is a natural choice for Lisp development. But if you're new to Clojure and you haven't used Emacs before, I would strongly suggest against learning both Emacs and Clojure at the same time. 

The reason being is that Emacs is fairly arcane in many ways, and it behaves very differently from traditional IDEs, such as NetBeans or Eclipse. Learning a new language, which has very different syntax from languages you might be used to, and requires learning a new programming paradigm is enough to keep one busy without having to learn a quirky IDE on the side.

My recommendation would be to grab a copy of [Eclipse](http://www.eclipse.org/downloads/packages/eclipse-ide-java-developers/junor) and install the [Counterclockwise plugin](http://code.google.com/p/counterclockwise/). Installing the plugin is incredibly simple, once you have Eclipse running follow the following steps:

* navigate to the "Install new Software" tab under the help menu
* paste in the CCW update URL: http://ccw.cgrand.net/updatesite in the "Work with:" text field 
* check the "Clojure Programming" checkbox and hit the "Next" button

Counterclockwise takes care of setting up Clojure and Leiningen for you. And once the plugin is installed, you will be able to create a new Clojure project or a new Leiningen project. I would recommend making Leiningen projects, since they allow easily managing dependencies by updating the `project.clj` file in the project directory. I'll touch more on this later.

At this point, I'll assume that you have Eclipse with CCW up and running. So, navigate to File->new->project in Eclipse menu. Then select Leiningen->Leiningen project. Here you'll see the `default` Leiningen Template filled in. And only thing you have to do is provide a project name. Let's call our project "clojure-test" and hit the finish button.

You should now see a new project in your Package Explorer view on the left. The project template will have a `src` folder which will contain the package folder named `clojure_test`. Since Java cannot use dashes in names, all the dashes in package folders for namespaces get converted to underscores. The pckage will contain a `core.clj` file, and its contents should look like the following:
```clojure
(ns clojure-test.core)

(defn -main
  "I don't do a whole lot."
  [& args]
  (println "Hello, World!"))
```
Let's open it and then hit the run button. You should see a REPL pop up momentarily on the bottom of the IDE. If all went well, your project should be ready to work on. The code that's in the file will have already been loaded up in the REPL when we hit run, and we should now be able to call our `-main` function.

To do that, let's write the code which calls main below it:
```clojure
(-main)
```
Then navigate the cursor inside the call body and hit CTRL+ENTER on Linux/Windows or CMD+ENTER on OS X. You should see "Hello, World!" printed in the REPL view on the bottom. We can now change the behavior of the `-main` function and after it is reloaded the new behavior will be available next time it's called.

I would also recommend enabling the "strict/paredit" mode under Preferences->Clojure->Editor section. This will allow the editor to keep track of balancing the parens for you. It might seem odd at first, but I highly encourage you to stick with it. 

Another useful feature of the editor is the ability to select code by expression. If you navigate inside a function and press ALT+SHIFT+UP (use CMD instead of ALT in OS X), then inner body of the expression will be selected, pressing it again, will select the expression, and then the outer body, and so on. Conversely pressing ALT+SHIFT+DOWN will narrow the selection. This allows you to quickly navigate nested structures, and select code by chunks of logic as opposed to simply selecting individual lines.

I've also mentioned the `project.clj` file in your project folder earlier. This file should look like the following:
```clojure
(defproject clojure-test "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.3.0"]])
```
You can add new dependencies to your project by simply sticking them in the dependencies vector. For example, if we wanted to add an HTTP client, we'd go to http://clojuresphere.herokuapp.com/ click on clj-http link. From there select the [Clojars link](http://clojars.org/clj-http/clj-http) and copy the following:
```clojure
[clj-http "0.5.2"]
```
now we'll simply paste it under dependencies in our `project.clj`:
```clojure
:dependencies [[org.clojure/clojure "1.3.0"]
               [clj-http "0.5.2"]]
```
In our package explorer view on the left we should be able to expand "Leiningen dependencies" and see the `clj-http` jar included there. We will now have to kill our current REPL, to do that navigate to the terminal view next to it and press the stop button. When we start a new instance of the REPL, the library will be available for use. In the core file we can now add it to the namespace:
```clojure
(ns clojure-test.core
 (:require [clj-http.client :as client]))
```
and test using the client by typing
```clojure
(client/get "http://google.com")
```
and running it as we did earlier. This should cover all the basics of using Clojure with Counterclockwise, and allow you to get hacking on your project.

I'd also recommend visiting the following sites:

* [4Clojure](http://www.4clojure.com/) is an excellent site for practicing small exercises in Clojure. Be sure to make an account and follow some of the top users. When you solve a problem, you'll be able to see how others solve it and get a taste for idiomatic Clojure code.
* [Clojure - Functional Programming for the JVM](http://java.ociweb.com/mark/clojure/article.html) is a very comprehensive introduction to Clojure aimed at Java programmers.
* [ClojureDocs](http://clojuredocs.org/) is an excellent documentation site for Clojure which contains many examples on using the functions in the standard library.
* [Noir](http://www.webnoir.org/) is an great Clojure framework for making web apps, in fact this blog is built on top of it with source available [here](http://github.com/yogthos/yuggoth).

There are many other great Clojure sites that I failed to mention here, but the above should provide a good starting point.




