{:title "A simple plugin system in Clojure",
 :layout :post,
 :tags ["cryogen" "clojure"]}

In this post we’ll see how to create a simplistic plugin system where plugins can be supplied as Leiningen dependencies and automatically initialized without any additional code change in the application.

Let’s take a look at Cryogen for a concrete example of how this can be useful. Cryogen started out using Markdown for content encoding, and we recently got a pull request that adds [AsciiDoc support](https://github.com/cryogen-project/cryogen/pull/43).

It’s always great to get additional features, but sometimes features also carry an undesirable cost. It turns out that AsciiDoc support relies on [AsciidoctorJ](https://github.com/asciidoctor/asciidoctorj), that in turn relies on JRuby and pulls in a huge amount of additional dependencies. This has a significant impact on the startup time of the application.

For anybody who isn’t using AsciiDoc the new feature simply degrades the user experience. So, ideally we’d like to keep AsciiDoc as a feature, but also avoid impacting users who aren’t using it. The ideal scenario is to be able to split out the parsers into standalone libraries and include the ones we need. This also has the benefit of people being able to write their own custom plugins that add the features they need without having to update the core project.

The approach I took here was to create an `init` function for each plugin that will take care of any initialization that the plugin needs to do and register it with the system.

All the available parsers are stored in an atom called `markup-registry` in [cryogen-core](https://github.com/cryogen-project/cryogen-core), and each plugin simply updates the registry when it loads:

```clojure
(defn init []
  (swap! markup-registry conj (markdown)))
```

The full code for the Markdown plugin can be seen [here](https://github.com/cryogen-project/cryogen-markdown/blob/master/src/cryogen_markdown/core.clj).

Next, we need to make our plugins discoverable so that they can be loaded when the application starts. This can be done using a configuration file that can be found on a classpath. Cryogen plugin configuration is stored in `resources/plugin.edn` using the following format:

```clojure
{:description "Markdown parser"
 :init cryogen-markdown.core/init}
```

Using the above information we can load the appropriate namespace and run the initializer function for the plugin.

First, we need to grab all the resources with the name `plugin.edn` which can done as follows:

```clojure
(defn load-plugins []
  (let [plugins (.getResources (ClassLoader/getSystemClassLoader) "plugin.edn")]
    (loop []
      (load-plugin (.. plugins nextElement openStream))
      (when (.hasMoreElements plugins)
        (recur)))))
```

Next, we read the configuration for each resource, require its namespace and then run the initializer functions as seen below:

```clojure
(defn load-plugin [url]
  (let [{:keys [description init]} (edn/read-string (slurp url))]
    (println (green (str "loading module: " description)))
    (-> init str (s/split #"/") first symbol require)
    ((resolve init))))
```

With that in place we simply run `load-plugins` when the applicatin starts and any plugins found on the classpath will be initialized. All the user has to do is select what plugins they want to include in their dependencies to get the functionality they need.
