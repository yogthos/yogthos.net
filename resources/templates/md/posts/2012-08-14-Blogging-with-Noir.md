{:title "Blogging with Noir", :layout :post, :tags ["noir" "clojure"]}

Writing a blog engine in Noir turned out to be a very pleasant experience. The [engine](https://github.com/yogthos/yuggoth) which is currently powering this blog  supports all the features one would expect from a blogging engine, some of which include:

* content caching
* RSS feed
* tags
* markdown in posts and comments with live preview
* syntax highlighting
* file uploads and management through web UI
* captchas for comments
* latest comments view
* controlling post visibility

All that weighs in at under 1K lines of Clojure, and some 50 lines of Js. I've outlined some of the quirks I ran into [previously](http://yogthos.net/blog/16-Noir+tricks). Now, I'd like to talk about what went right and what facilitated writing a complete functional website in only a few hundred lines of code.

I used [clojure.java.jdbc](https://github.com/clojure/java.jdbc/) for database access. The library is very easy to use and provides all the basic functionality you'd expect with minimal fuss. You can define a database either using a map:
```clojure
(def mysql-db {:subprotocol "postgresql"
               :subname "//127.0.0.1:3306/clojure_test"
               :user "clojure_test"
               :password "clojure_test"})
```
by providing a JNDI name and configuring a JNDI data source on the app server:
```clojure
(def my-db {:name "jdbc/myDatasource"})
```
or by simply instantiating a data source as I do in the blog:
```clojure
(def db 
  {:datasource 
    (doto (new PGPoolingDataSource)
       (.setServerName   (:host blog-config))
       (.setDatabaseName (:schema blog-config))
       (.setUser         (:user blog-config))
       (.setPassword     (:pass blog-config))
       (.setMaxConnections 10))})
```
Calling SQL commands is straightforward as well, all statements must be wrapped with a `with-connection` statement. This ensures that any result sets are cleaned up and the connection is closed once you're done with it. I found the library to be very intuitive and easy to work with. The documentation [is available on github](https://github.com/clojure/java.jdbc/tree/master/doc/clojure/java/jdbc) and covers most use cases. All of my db interaction ended up fitting in just under 250 lines, which makes it easy to keep on top of.

[Noir](http://www.webnoir.org/) has been indispensable in making things concise and easy to manage. Noir and [Hiccup](http://weavejester.github.com/hiccup/) make it trivial to organize the pages and their controllers into self contained chunks.

Because it encourages making things stateless, it's easy to add functionality in isolated chunks. This means that you can add a particular feature, such as RSS support, without having to worry how it might interact with existing code. I find this especially important when writing side projects as it means that you have a very short ramp up time when you come back to a project after not having touched it for a while.

I'm personally a fan of using Hiccup for generating HTML, as it allows using the full power of Clojure for templating. However, some people have concerns about not having the actual HTML that designers can then style. Fortunately, there's nothing inherent to Noir that ties it to Hiccup. A `defpage` simply has to return an HTML string, how that string gets generated is entirely up to you. And there's a [great guide](http://paulosuzart.github.com/blog/2012/03/25/web-noir-plus-enlive-template/) for using Noir with [Enlive](https://github.com/cgrand/enlive/), which is designed for HTML based templating. Again, I have to point out the thoughtfulness of design which separates creating routes and serving pages from the libraries which deal with actually generating them.

For Markdown parsing I dredged up [an old library of mine](https://github.com/yogthos/markdown-clj), and with a few tweaks it's been doing its job as far as far as this blog is concerned. One advantage of this particular library is that it compiles to both Clojure and ClojureScript, so I can do previews in the browser and guarantee that they will be rendered the same by the server.

I added the ability to add language hinting using github style markdown, eg: &#96;&#96;&#96;clojure, to output tags compatible with the [syntax highlighter](http://alexgorbatchev.com/SyntaxHighlighter/), which I then use to do code highlighting in the browser.

I also didn't find any readily available libraries for generating RSS from Clojure, so I proceeded to make [clj-rss](https://github.com/yogthos/clj-rss), which turned out to be very easy thanks to the excellent XML support in the standard library and a few macros.

For my captcha needs I turned to a Java library called [jlue](http://mvnrepository.com/artifact/net.sf.jlue/jlue-core). Thanks to the excellent Java interop, using it is quite seamless:
```clojure
(defn gen-captcha []
  (let [text (gen-captcha-text)
        captcha (doto (new Captcha))]
    (session/put! :captcha 
                  {:text text 
                   :image (.gen captcha text 250 40)})))

(defpage "/captcha" []
  (gen-captcha)
  (resp/content-type 
    "image/jpeg" 
    (let [out (new ByteArrayOutputStream)]
      (ImageIO/write (:image (session/get :captcha)) "jpeg" out)
      (new ByteArrayInputStream (.toByteArray out)))))
```

Finally, all of the building and packaging is handled by [Leiningen](http://github.com/technomancy/leiningen/), which makes it trivial to track dependencies and package up the resulting application. In my case I'm deploying the blog to Tomcat, and so I simply build a WAR using:
```bash
lein ring uberwar
```
The resulting WAR can be dropped on any Java application server. If you wanted to deploy to Heroku, you simply have to add a `Procfile` to the root directory of the project with the following contents:
```bash
web: lein trampoline run -m yuggoth.server
```
Overall, I experienced very few issues and found the experience to be overwhelmingly positive. In my opinion the current tools and libraries available in Clojure allow writing web sites just as easily, if not more so, as most of the established languages out there.