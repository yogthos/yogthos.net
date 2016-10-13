{:title "Configuring Atom for Luminus"
 :layout :post
 :tags ["clojure" "luminus" "atom"]}

There are many editors and IDEs available for Clojure today. The most popular ones are Emacs with [CIDER](https://github.com/clojure-emacs/cider) and IntelliJ with [Cursive](https://cursive-ide.com/). While both of these options provide excellent development environments, they also require a bit of learning to become productive in.

Good news is that you don't have to learn a complex environment to get started. This post will walk you through the steps of configuring [Atom editor](https://atom.io/) editor to work with a Luminus project. We'll see how to configure Atom for editing Clojure code and how to connect it to the remote REPL started by the Luminus app for interactive development.

### Configuring Atom

At the very minimum you should install either [parinfer](https://atom.io/packages/parinfer) or [lisp-paredit](https://atom.io/packages/lisp-paredit) package for structural editing, and [proto-repl](https://atom.io/packages/proto-repl) for REPL driven development.

A structural editor eliminates the need to manually balance parens. It takes a bit of getting used to, but it will make working with Clojure a lot more pleasant in the long run.

The REPL is the other essential tool for working with Clojure. It's integrated with the editor and allows running any code that we write directly in the application.

Finally, I recommend installing the [highlight-selected](https://atom.io/packages/highlight-selected) package that let's you easily see usages of a symbol within the file.

These are all the packages you need to get a decent Clojure editing environment. Let's see how we can connect to its nREPL using Atom.

### Connecing the REPL

We'll create a new Luminus project by running the following command:

    lein new luminus myapp +h2

Once the project is created, we can go to the project folder and run the migrations:

    cd myapp 
    lein run migrate
    
We're now ready to start the app in development mode:    

    lein run

The app will start the nREPL server on `localhost:7000` once it loads. Let's open the project in Atom and connect to the nREPL instance.

The default keybinding for connecting to the nREPL is `ctrl-alt-, y` on Windows/Linux and `cmd-alt-, y` on OS X. This should pop up a dialog asking for the host and the port. Enter `7000` as the port and hit `enter`. If everything went well the REPL should now be connected to your project.

Let's open a source file in the project and see if we can evaluate some code from it. For example, let's navigate to the `myapp.db.core` namespace and try to run some of the database query functions.

There are a few commands for doing this, I recommend starting by using the `ctrl-alt-, B` shortcut that sends the top-level block of code to the REPL for execution.

### Editing

Finally, let's take a quick look at some basics of using paredit. Paredit is a structural editor and it will take care of balancing parens for you.

For example, you'll notice that when you open a paren, then a matching closing paren is added automatically. The cursor is placed inside the parens so that you can start typing the inner content.

When you select an expression, and add a paren, then the expression will be wrapped with the outer parens. The package also provides a handy `ctrl-w` shortcut that will extend the selection by expression.

This is the recommended way to select code as you don't have to manually match the start and end of an expression when selecting.

A couple of other useful shortcuts are slurp and barf. Slurping will pull an adjacent expression into the expression with the cursor, and barf will push out an expression.

That's all there is to it. While this setup is fairly minimal, it will let you play with a lot of Clojure features without having to spend practically any time learning and configuring an editor.