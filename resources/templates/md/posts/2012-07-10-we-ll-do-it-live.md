{:title "we'll do it live!", :layout :post, :tags []}

One thing I love about working in Clojure is how interactive the development environment is. Clojure being a Lisp provides a REPL (read, evaluate, print, loop), which works exactly like it sounds. You send an expression to the reader, which will then evaluate it, print the result, and wait for another expression to read.

Clojure IDEs provide tight integration with the REPL. It is possible to connect your application to it and have it load all the libraries and dependencies. At this point you can write your new code in the IDE and have the REPL evaluate it in the context of your running application.

In non-trivial applications it's often necessary to build up a particular state before you can add more functionality. For example a user has to login then view some data from a backend, then you need to write functions to format and display this data. With a REPL you can get the application to the state where the data is loaded and then write the display logic interactively without having to reload the application every time you make a change.

I find this method of development a lot more satisfying, as you get immediate feedback from your application when you add or modify code, and you can easily try things and see how they work. It encourages extermination and refactoring code as you go, which I think helps write better and cleaner code. 

This technique is common in Lisp and Smalltalk development, but for reasons unknown has not penetrated into mainstream languages.

