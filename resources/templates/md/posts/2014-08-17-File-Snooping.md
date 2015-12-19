{:title "File Snooping", :layout :post, :tags ["clojure"]}

I recently needed to watch files for changes and had a chance to play around with using the `WatchService` functionality in JDK 7. As is generally the case with Java, the API requires you to jump through a number of hoops to do anything, but turns out that it’s possible to wrap it up into something reasonable in the end.

The `WatchService` can be used to watch directories and provides different types of events, such as create, modify, delete, and overflow. The first three are self-explanatory and the last is a special event that’s triggered when an event might have been discarded or lost.

What we’d like to do is create a function called `watch` that accepts an input path along with event handlers for each of the above events.

To create a watcher we first need to get an instance of a `Path`. To do that we have to call `(-> path (file) (.toURI) (Paths/get))`. Next, we can get an instance of the `WatchService` by calling `(.newWatchService (FileSystems/getDefault))`

Now that we have a `Path` and a `WatchService`, we can register the service with the path to listen for the events we specify.

To handle this, I ended up creating a map with the keys representing the events and the values being the event handling functions.

```clojure
{:create event-handler
 :modify event-handler}
```
When the event is triggered we will receive an instance of the  `WatchEvent`. So, the handler functions should accept it as the parameter.

```clojure
(defn event-handler [event]
  (println (.kind event) (.context event)))
```
Next, I created a couple of helpers to map the keywords to the appropriate events:

```clojure
(defn register-events! [dir watch-service opts]
  (.register dir watch-service
    (-> opts
       (select-keys [StandardWatchEventKinds/ENTRY_CREATE
                     StandardWatchEventKinds/ENTRY_MODIFY
                     StandardWatchEventKinds/ENTRY_DELETE
                     StandardWatchEventKinds/OVERFLOW])
       (keys)
       (into-array))))

(defn rename-event-keys [opts]
  (rename-keys opts
    {:create StandardWatchEventKinds/ENTRY_CREATE
     :modify StandardWatchEventKinds/ENTRY_MODIFY
     :delete StandardWatchEventKinds/ENTRY_DELETE
     :overflow StandardWatchEventKinds/OVERFLOW}))
```
The transformed map is now ready for use. The `WatchService` implements closeable, so we can use the `with-open` macro to manage it:

```clojure
(defn watch [path opts]
  (let [dir (-> path (file) (.toURI) (Paths/get))
        opts (rename-event-keys opts)]
    (with-open [watch-service
                (.newWatchService (FileSystems/getDefault))]
      (register-events! dir watch-service opts)
      (watch-loop watch-service opts))))
```
The `watch` function will register the events we passed in, open the watch service and then call the `watch-loop` function to do the actual watching.

```clojure
(defn watch-loop [watch-service opts]
  (loop []
    (let [k (.take watch-service)]      
      (doseq [event (.pollEvents k)]
        (if-let [handler (get opts (.kind event))]
          (handler event)))
      (when (.reset k) (recur)))))
```
The `watch-loop` starts each iteration by calling `take` on the watch service. This method blocks until it receives an event, the service is closed or it’s interrupted.

Once we receive an event we can look it up in our options map and call the handler for the event. Finally, we need to call `reset` on the key before we start the next iteration.

Since the `take` function blocks, we probably want to run it in a thread:

```clojure
(defn start-watcher! [path opts]
  (doto (Thread. #(watch path opts))
    (.setDaemon true)
    (.start)))
```

The above will start a background watcher thread and return it. The thread is daemonized, so that it doesn’t prevent the application from exiting. Example usage for the above can be to track when files are created or modified in the directory:

```clojure
(start-watcher! “~/downlads”
  {:create #(println “file created” (-> % (.context) (.toString)))
   :modify #(println “file modified” (-> % (.context) (.toString)))})
```
That’s all there is to it and the full source for the example can be seen [here](https://gist.github.com/yogthos/911e6aba9802ceacd83c).

### Update

As one of the comments points out, JDK will poll on OS X and the default poll interval is quite large. In order to get around this we can force high sensitivity when we register the `WatchService` as follows:

```clojure
(defn register-events! [dir watch-service]
  (.register dir
    watch-service
    (into-array
      [StandardWatchEventKinds/ENTRY_CREATE
       StandardWatchEventKinds/ENTRY_MODIFY
       StandardWatchEventKinds/ENTRY_DELETE
       StandardWatchEventKinds/OVERFLOW])
    (into-array
      [(com.sun.nio.file.SensitivityWatchEventModifier/HIGH)])))
```
 
