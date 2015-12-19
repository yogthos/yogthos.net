{:title "New Templating Engine in Luminus",
 :layout :post,
 :tags ["clojure" "luminus"]}

I'm happy to announce that [Luminus](http://www.luminusweb.net/) now defaults to using [Clabango](https://github.com/danlarkin/clabango) for HTML templating instead of [Hiccup](https://github.com/weavejester/hiccup).

I'd like to explain some of the reasoning behind this decision. The primary drive behind Luminus is to make Clojure web development more accessible. This means that the barrier to entry for those who are new to the language should be as low as possible.

Since Clabango is based on the [Django templates](https://docs.djangoproject.com/en/1.4/topics/templates/), it's immediately familiar to anybody who's done templating with other frameworks such as Django, Rails, or JSP. This also makes it easier to migrate exiting sites to use Luminus.

Because the templates are written in plain HTML it's easy to work with designers and other people who aren't versed in Clojure.

Finally, Clabango enforces the separation between the application logic and the presentation. When using Hiccup it's for one to start bleeding into the other if you're not careful.

However, if you are a fan of Hiccup there's nothing to worry about.  Everything will work as it did before if you use the `+hiccup` flag when creating the application.

As always feedback and suggestions are most welcome. :)