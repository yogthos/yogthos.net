{:title "New kid on the templating block",
 :layout :post,
 :tags ["clojure" "luminus"]}

## Update: [Selmer](https://github.com/yogthos/Selmer) is currently the recommended Django style templating engine

As you may know, there are a few Clojure templating engines floating around. The two most popular ones are probably [Hiccup](https://github.com/weavejester/hiccup) and [Enlive](https://github.com/cgrand/enlive).

Hiccup is a nice and simple templating engine. Unfortunately, its biggest advantage is also it's greatest weakness. Since Hiccup templates are written using Clojure data structures, they're simply part of your regular code.

This makes the templates inaccessible to people not versed in Clojure. For example, if you're working with a designer, you can't just give them your template to work with.

Another issue is that it makes it easy for your frontend and backend logic to bleed into each other if you're not careful. Finally, you have to redeploy your site any time you wish to make a change to the layout.

Enlive avoids these problems by using a more traditional approach and using plain HTML markup for its templates. The problem with Enlive lies in its complexity. This spawned [Laser](https://github.com/Raynes/laser), which also allows using pure HTML without any additional markup for its templates. In the words of the author:

>Enlive does its job and is the precursor to the way laser does things. However, it is very large and (arguably?) complex compared to laser. laser strives to be as simple as possible.

If you haven't already checked out Laser I certainly urge you to do so!

However, the engine I'd like to focus on in this post is [Clabango](https://github.com/danlarkin/clabango). It's modeled after Django's templating library and I found that it clicked with me immediately. 

Let's take a look at how to convert the example [guestbook application](http://www.luminusweb.net/docs/guestbook.md) from Luminus to use Clabango instead of Hiccup.

We'll first create the project with support for H2 embedded DB by running:

```
lein new luminus guestbook +h2
```

We'll then open up our `project.clj` and add the Clabango `[clabango "0.5"]` dependency it.

Next, we'll create a `templates` folder under resources/public. This is where all the Clabango templates will live.

Clabango provides two way to load templates using the `clabango.parser` namespace. We can either use `render-file` function to load a template from a file or `render` to load it from a string.

These functions take two parameters, the template source and a map containing the items that will be populated in the template when it's compiled.

For example, if we had a template such as:

```xml
<h2>Hello {{user}}</h2>
```

We could then render it by calling `render` as follows:

```clojure
(render "<h2>Hello {{user}}</h2>" {:user "John"})
```

Clabango will then replace every occurance of `{{user}}` with `John` instead. In case `user` happens to be a map, we can access its keys using the dot notation:

```xml
<h2>Hello {{user.last}}", " {{user.first}}</h2>
```
The  templates provide support for some other useful things like filters, tag definitions, and template inheritance. However, we won't worry about any of that right now.

Let's take a look how to load up the templates using the `render` function. We won't use `render-file` since it looks for resources relative to the `src` folder. We'll use `lib-noir.io/slurp-resource` to load our templates from the `public` folder instead. We'll create a helper in our `guestbook.util` namespace to do that:

```clojure
(ns guestbook.util  
  (:require ...
            [clabango.parser :as parser]))


(defn render [template params]
  (parser/render (io/slurp-resource template) params))
```

With that out of the way, let's create the model for our application. We'll open up the `guestboook.models.schema` namespace and replace `create-users-table` with  `create-guestbook` table:

```clojure
(defn create-guestbook-table []
  (sql/with-connection
    db-spec
    (sql/create-table
      :guestbook
      [:id "INTEGER PRIMARY KEY AUTO_INCREMENT"]
      [:timestamp :timestamp]
      [:name "varchar(30)"]
      [:message "varchar(200)"])
    (sql/do-commands
      "CREATE INDEX timestamp_index ON guestbook (timestamp)")))
```

then update `create-tables` to call it instead:

```clojure
(defn create-tables
  "creates the database tables used by the application"
  []
  (create-guestbook-table))
```

We'll also update the `init` function in the `guestbook.handler` to call `create-tables` if the database isn't already initialized:

```clojure
(defn init []
  (if-not (schema/initialized?) (schema/create-tables))
  (println "guestbook started successfully..."))
```

Next, let's open up the `guestbook.models.db` namespace and replace the code to create and retrieve users with the code to save and load messages:

```clojure
(ns guestbook.models.db
  (:use korma.core
        [korma.db :only (defdb)])
  (:require [guestbook.models.schema :as schema]))

(defdb db schema/db-spec)

(defentity guestbook)

(defn save-message
  [name message]
  (insert guestbook 
          (values {:name name
                   :message message
                   :timestamp (new java.util.Date)})))

(defn get-messages []
  (select guestbook))
```

We can test that everything works by calling `save-message` from the REPL to create some messages and then calling `get-messages` to see that they're retrieved correctly. If everything works as expected then we're ready to take a look at making our pages. 

First, let's create a template for the home page. We'll do this by making a `welcome.html` file under the `resources/public/templates` folder.

Here is where we finally get to see Clabango in action. We'll first use it to iterate the messages and create a list from them:

```xml
<ul>
{% for item in messages %}
  <li> 
      <blockquote>{{item.message}}</blockquote>
      <p> - {{item.name}}</p>
      <time>{{item.timestamp}}</time>
  </li>
{% endfor %}
</ul>
```
As you can see above, we use a `for` iterator to walk the messages. Since each message is a map with the `message`, `name,` and `timestamp` keys, we can access them by name.

Next, we'll add an error block for displaying errors that might be populated by the controller:

```xml
{% if error %}
<p>{{error}}</p>
{% endif %}
```

Here we simply check if the error field was populated and display it. Finally, we'll create a form to allow users to submit their messages:

```xml
<form action="/" method="POST">
	<p>Name: <input type="text" name="name" value={{name}}></p>
	<p>Message: <input type="text" name="message" value={{message}}></p>
	<input type="submit" value="comment">
</form>
```

This takes care of creating the template, now let's take a look at how we populate the templated fields in our controller.

We'll navigate to the `guestbook.routes.home` namespace and update our home function to render the template when called:

```clojure
(defn home-page [& [name message error]]
  (layout/common   
    (util/render "/templates/welcome.html" 
                 {:error    error
                  :name     name
                  :message  message
                  :messages (db/get-messages)})))
```

Above, we simply create a map with all the fields we wish to populate. Then we pass it along with the name of the template file to the `render` function we defined earlier. Note that we can keep using the Hiccup layout to create the skeleton for the pages.  The rest of the code in the `home` namespace stays the same as it was:

```clojure
(defn save-message [name message]
  (cond
 
    (empty? name)
    (home-page name message "Some dummy who forgot to leave a name")
 
    (empty? message)
    (home-page name message "Don't you have something to say?")
 
    :else
    (do
      (db/save-message name message)
      (home-page))))

(defroutes home-routes
  (GET "/" [] (home-page))
  (POST "/" [name message] (save-message name message))
  (GET "/about" [] (about-page)))
```

As you can see, Clabango is very simple to use and allows cleanly separating your markup from your controllers. I think it's an excellent addition to the ever growing Clojure toolbox.

Complete sources for this post are available [here](https://github.com/yogthos/clabango-guestbook).

**update**
***

The approach I took with putting templates under the `resources` folder will not work with template inheritance. So, you're best off simply using `render-file` from Clabango and keeping your templates under the `src` folder.