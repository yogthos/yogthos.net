{:title "Cryogen: static site generation made easy",
 :layout :post,
 :tags ["clojure" "cryogen"]}

[Cryogen](https://github.com/lacarmen/cryogen) is a new Clojure static site generator by [Carmen La](https://github.com/lacarmen). Since there are already many popular site generators such as Jekyll, let's take a look at what makes Cryogen interesting.

In my opinion, the main feature of this project is its simplicity. Cryogen is shipped as a Leiningen template and all you have to do to create a site is run:

```
lein new cryogen my-blog
```

This will create an instance of the project with a template site initialized. The site can be run in dev mode using:

```
lein ring server
```

 Once started, a helpful readme is shown on what to do next, which is a really nice touch.

The server will watch for changes in the `resources/templates` folder and recompile the site whenever updates are detected. The compiled site is served from `resources/public`. The static assets generated there can now be copied to over to be served by Nginx or Apache in production.

The layout is handled using [Selmer](https://github.com/yogthos/Selmer) templates, while the content of the posts and the pages is written using Markdown with the help of [markdown-clj](https://github.com/yogthos/markdown-clj).

The generator handles all the common things like linking up pages, creating tags, syntax highlighting, sitemap, and RSS our of the box.

While most site generators take the approach of providing numerous configuration options for customization, Cryogen simply gives you the code to customize any way you see fit. You can simply go to the `cryogen.compiler` namespace and easily change its behaviour to fit whatever it is you're doing. The compiler code is very clean and easy to follow, making it easy to customize.

I definitely recommend taking a look at this project if you're looking to make a static site in the future.
