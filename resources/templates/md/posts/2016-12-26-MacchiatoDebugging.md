{:title "Using Chrome DevTools with Macchiato"
 :layout :post
 :tags ["clojurescript" "macchiato" "node"]}

Chrome DevTools provide a lot of useful features for debugging and profiling applications in the browser. As it happens, you can to connect DevTools to a Node.js process as well. Let's take a look at debugging the [guestbook project](https://github.com/macchiato-framework/examples/tree/master/guestbook) from the examples repository.

You'll first have to start Figwheel to compile the project by running the following command:

```
lein build
```

Once the project is compiled, you have to start Node with the `--inspect` flag:

```
$ node --inspect target/out/guestbook.js

Debugger listening on port 9229.
Warning: This is an experimental feature and could change at any time.
To start debugging, open the following URL in Chrome:
    chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:9229/0dbaef2a-996f-4229-8a52-6c4e50d0bf18
INFO [guestbook.core:19] - guestbook started on 127.0.0.1 : 3000
Figwheel: trying to open cljs reload socket
Figwheel: socket connection established
```

You'll see that there's a URL printed in the console when the app starts. Copy this URL and open it in Chrome to connect DevTools to your Node process. At this point you can use all the tools the same way you would with an application running in the browser. You can debug ClojureScript files, profile the process, and so on.

#### Gotchas

Unfortunately, there's a [small bug](http://dev.clojure.org/jira/browse/CLJS-1864) in the ClojureScript compiler that prevents timestamped source maps from working with Node. The problem is that that the compiler assumes that ClojureScript is running in browser and appends `?timestamp` at the end of the file name as if it was a URL. Since Node is looking for actual files on disk, it fails to find the source map.

Currently, the workaround for this is to set `:source-map-timestamp false` in the compiler options. However, since Node caches the source maps, you have to restart the process any time you make a change in the code to get accurate line numbers.

The good news is that restarts happen instantaneously, and you can automate this process using Node supervisor as follows:

```
npm install supervisor -g
supervisor --inspect target/out/guestbook.js
```

That's all there is to it.
