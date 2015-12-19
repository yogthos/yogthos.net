{:title "Web Development with Clojure 2"
 :layout :post
 :tags ["luminus" "clojure"]}

First, I'd like to thank all those who purchased the first edition of the book. I was overwhelmed by the response from the readers, and exhilirated to learn that it helped many start developing their web applications using Clojure. I'm excited to announce that I'm working on the second edition of [Web Development with Clojure](https://pragprog.com/book/dswdcloj/web-development-with-clojure) and that I'm expecting to publish it sometime this summer.

## What to Expect

The main goal of the book is to provide a no-nonsense introduction to web development using Clojure. As such, I chose to cover tools and libraries that I consider to be beginner friendly.

Clojure web ecosystem has been steadily maturing since the release of the first edition. Last time I illustrated a number of approaches for putting applications together without recommending any one in particular over the others. This time around I'm primarily focusing on building application based on the  [Luminus](http://www.luminusweb.net/) stack. Luminus has recently seen [a major update](http://yogthos.net/posts/2015-02-28-Luminus-2.0.html) and continues to provide a solid foundation for building Clojure web applications according to best practices.

Clojure community favors using composable libraries over monolithic frameworks. This approach offers a number of advantages by giving the developer full control over the structure of the application the components used in it.

However, this approach works best for experienced developers who have a good understanding of the ecosystem and the available libraries. Having to develop this experience presents a significant barrier for newcomers. Luminus mitigates this issue by providing a batteries included template coupled with centralized documentation. This makes it a perfect foundation for a book aimed at beginners.

If you're familiar with the Clojure basics and you're looking to apply it for building web applications then this book is for you. The book aims to provide the reader with the understanding of the core ecosystem and the available tooling.

## What's New

Those who are familiar with the first edition will find a number of changes and a number of new topics covered this time around.

At the time of writing of the first edition I felt that ClojureScript was not quite ready for general consumption. While some companies were already using it in production, the tooling around it was often challenging to use. As such, the book only gave it a very brief introduction and focused on traditional server side templating instead.

ClojureScript has matured greatly in the past year and the tooling is rapidly improving, while libraries such as Om and Reagent provide a clear benefit over using plain JavaScript. This time around ClojureScript is front and center with a primary focus on building single page apps using the Reagent library. I chose Reagent over Om for reasons I've discussed [here](http://yogthos.net/posts/2014-07-15-Building-Single-Page-Apps-with-Reagent.html). In short, I find that it's much easier to learn and apply effectively. The main project in the book that guides the reader through developing a multi-user picture gallery application is now developed as a single page application using Reagent.

Another major change is that I no longer recommend using [lib-noir](https://github.com/noir-clojure/lib-noir) for developing new applications. While the library provides a number of helpers for achieving many common tasks found in typical web applications, it also introduces some problems inherent in its design. I've discussed some of these  in my [last post](http://yogthos.net/posts/2015-02-28-Luminus-2.0.html). Today, there are excellent standalone libraries available for each of the tasks that `lib-noir` was used for and I recommend using these instead.

The database chapter has been updated to introduce the excellent [Yesql](https://github.com/krisajenkins/yesql) library and use the syntax of the latest version of [clojure.java.jdbc](https://github.com/clojure/java.jdbc).

I’m now covering the use of the [compojure-api](https://github.com/metosin/compojure-api) library along side [Liberator](http://clojure-liberator.github.io/liberator/). I’ve had an excellent experience using this library and I highly recommend trying it out if you haven’t already. The library uses [Prismatic/schema](https://github.com/Prismatic/schema)  to define the service API and allows automatic generation of interactive [Swagger](http://swagger.io/) documentation such as seen [here](http://petstore.swagger.io/).

Finally, the book will provide more information on topics such as database migrations and deployment as part of addressing some of the feedback from the previous edition.

My hope is that the book will be useful to both new readers as well as those who purchased the first edition.

