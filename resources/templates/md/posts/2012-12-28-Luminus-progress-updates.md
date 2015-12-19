{:title "Luminus progress updates",
 :layout :post,
 :tags ["luminus" "clojure"]}

In this post I'd like to give some updates on the progress of Luminus and the direction it's moving in. 

I've had some great chats over at #clojure on IRC, and there's been lots of ideas and brainstorming. It's a very friendly and informative place if you haven't yet visited. :)

After talking it over with Raynes we decided that it would be much better to simply add things to [lib-noir](https://github.com/noir-clojure/lib-noir) than to roll a new library. So, lib-luminus is no more, and instead all the updates will be happening in `lib-noir` now.

All the current helper functions have already been rolled into version 0.3.0 of `lib-noir`, so definitely switch to it if you're using `lib-luminus` currently. The good news is that all you need to do is replace `[lib-luminus "0.1.5"]` with `[lib-noir "0.3.0"] in your `project.clj`, and update your namespaces to reference it instead. The function names and behaviour haven't changed.  

This segues into the next topic of how the line is drawn between what goes into the library and what belongs in the template. 

The strategy here is to add functionality to `lib-noir, while putting configuration in the template. This facilitates an easy path for upgrades as the library continues to improve and evolve, while keeping all the customization in the hands of the user. It also means that the template will act as documentation for how to configure your application.

As the template continues to grow, it will be increasingly difficult to please everybody with a single template. For example, somebody might want to use  PostreSQL for their db, while another person might like MySQL, and yet another uses CouchDB and doesn't want to see any of the SQL business at all. 

As these things tend to be rather polarizing, the approach will be to let people choose the items they want. Luminus aims to be more of a buffet, where you pick what's on your plate, as opposed omakase with the chef telling you what to eat. :)

To this end, the latest release of Luminus provides a base template which can be extended using `+feature` notation. Currently, there's two features supported, the first is the addition of bootstrap into the project and the second is support for SQLite.

The way this works is if you want to make a basic application, you'd do the same thing you did before.

```bash
lein new luminus myapp
```

But if you wanted to have bootstrap in your app, then you'd simply do this:

```bash
lein new luminus myapp +bootstrap
```
The best part is that you can mix different extensions together, eg:
```bash
lein new luminus myapp +bootstrap +sqlite
```
When you do that, both features will be added to the resulting project. However, if they have any common files between the two features, then the latest one overwrites the former.

Hopefully, this approach will provide an easy way to add extended configuration while keeping things compartmentalized and easy to maintain. The latest documentation and examples are available at the official [Luminus](http://www.luminusweb.net) site.





