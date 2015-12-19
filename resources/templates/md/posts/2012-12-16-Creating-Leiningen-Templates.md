{:title "Creating Leiningen Templates",
 :layout :post,
 :tags ["clojure"]}

If you've used Leiningen before, you've already seen templates in action. When you create a project using `lein new myproject`, you end up with a project folder with a namespace called myproject and a core.clj inside it. 

The templates are really useful if you need to setup some common boilerplate for your project. In the last post I referenced a template for Compojure, which creates a new batteries included project.

Leiningen uses the [lein-newnew](https://github.com/Raynes/lein-newnew) plugin for this task. All you have to do to create a new template is to run `lein new template <template name>`. In my case I created a template called `compojure-app`:

```bash
lein new template compojure-app
```

As all Leiningen projects, it will contain the `project.clj`, which will contain the description for our project:

```clojure
(defproject compojure-app/lein-template "0.2.7"
  :description "Compojure project template for Leiningen"
  :url "https://github.com/yogthos/compojure-template"
  :eval-in-leiningen true
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[leinjacker "0.2.0"]])
```

It looks like a regular project file, except for the `eval-in-leiningen` key which ~~causes Leiningen to launch a subprocess~~ prevents Leiningen from launching a separate process for the given project during the build time.

The actual template resides under

```
src/compojure-template/leiningen/new/compojure_app.clj
```

It looks as follows:

```clojure
(ns leiningen.new.compojure-app
  (:use [leiningen.new.templates :only [renderer sanitize year ->files]]
        [leinjacker.utils :only [lein-generation]]))

(def project-file
  (if (= (lein-generation) 2)
    "project_lein2.clj"
    "project_lein1.clj"))

(defn compojure-app
  "Create a new Compojure project"
  [name]
  (let [data {:name name
              :sanitized (sanitize name)
              :year (year)}
        render #((renderer "compojure_app") % data)]
    (println "Generating a lovely new Compojure project named" (str name "..."))
    (->files data
             [".gitignore"  (render "gitignore")]
             ["project.clj" (render project-file)]
             ["README.md"   (render "README.md")]
             ["src/{{sanitized}}/handler.clj"      (render "handler.clj")]
             ["src/{{sanitized}}/server.clj"       (render "server.clj")]
             ["src/{{sanitized}}/common.clj" (render "common.clj")]
             ["resources/public/css/screen.css" (render "screen.css")]
             "resources/public/js"
             "resources/public/img"
             "src/{{sanitized}}/models"
             ["test/{{sanitized}}/test/handler.clj" (render "handler_test.clj")])))
```

The `compojure-app` function is where all the fun happens, and it's what gets called when we run `lein new compojure-app myapp` to create an application using this template.

The function is mostly self explanatory. It uses the `render` function from `leiningen.new.templates` to take the template files and put them at the specified path. The `{{sanitized}}` tag ensures that the generated names for the package folders are valid.

Our template files live under 

```
src/compojure-template/leiningen/new/compojure_app
```
and they don't need to have the same folder structure as the resulting project. As you can see above, we specify the resulting path explicitly in our template.

The template files look exactly like any regular Clojure source file, except for the `{{name}}` anchor. This will be replaced with the name of the application we specified when creating the project. Here's the `common.clj` template as an example:

```clojure
(ns {{name}}.common
  (:use [hiccup.page :only [html5 include-css]]))
       
(defn layout [& body]
  (html5 
    [:head
     [:title "Welcome to {{name}}"]
     (include-css "/css/screen.css")]
    (into [:body] body)))
```

Every occurrence of `{{name}}` will be replaced with myapp instead and we'll have our namespace and greeting customized.

Once you've created your template, you'll need to install it using `lein install` and then add it as a plugin to your profile under `~/.lein/profiles.clj` using the following format:

```clojure
{:user
  {:plugins [[compojure-app/lein-template "0.2.7"]]}}
```

That's it, you can now use your new template and never have to write boilerplate for this kind of project again.

If you wish to make your template available to others you can publish it to [Clojars](https://clojars.org/) by running `lein deploy clojars` from the console.

Any template published on Clojars can be used directly without needing to add it to your plugins in the `profiles.clj` as shown above.

The complete source for the template discussed in this post is available [here](https://github.com/yogthos/compojure-template).