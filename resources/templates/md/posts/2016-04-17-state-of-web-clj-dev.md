{:title "The State of Clojure Web Development", :layout :post, :tags [“luminus” “arachne”]}

The Kickstarter for the [Arachne](https://www.kickstarter.com/projects/1346708779/arachne-rapid-web-development-for-clojure) framework was just announced. I think this is very exciting, and I sincerely hope that it will be successful. There is plenty of room for frameworks in the Clojure web application domain. However, I also think that the pitch in the video severely misrepresents the current state of Clojure web development.

### Is it hard to make an app?

Luke says that the motivation for the project is that there is no simple way to put a Clojure web app together. You want to make a website quickly, but unfortunately Clojure is not well suited for this task because the lead time is just too long.

Luke goes as far as to say that starting a new Clojure web application with all the parts together, that's actually deployable is a one to three months process.

Simplifying this process is precisely the [motivation](https://www.youtube.com/watch?v=JKoaG4kSyxs&t=14m53s) behind [Luminus](http://www.luminusweb.net/). In fact, Luminus, and other frameworks such as [Hoplon](https://hoplon.io/), have been filling this exact niche for years now. While I’m not as familiar with Hoplon, I will focus on contrasting the stated goals behind Arachne and the goals for Luminus.

First thing I’d like to address is the claim that it takes a long time to create a web application following best practices. Creating a new Luminus app is as easy as running `lein new luminus myapp` in the terminal. Perhaps what Luke meant was that creating an application using his preferred stack and defaults takes a long time.

Luminus is based on over a decade of experience working in the enterprise environment and building real world applications. It's built on top of mature libraries that are known to work well together. These are wrapped up in a template that follows the best practices, and makes it easy to create a working application that's ready for deployment out of the box.

Some of the things Luke lists are:

* Overall structure
* Resource lifecycle management
* Routing
* Content negotiation
* HTML rendering
* Authentication & authorization
* Validation
* Logging
* Testing

All of these are supported out of the box in Luminus.

### What about beginners?

Another problem Luke identifies is that there needs to be a tool for beginners, or people new to the Clojure language. Once again, this is precisely the target demographic for Luminus.

I've literally spent years working with existing libraries, [creating my own](https://github.com/yogthos/Selmer) when necessary, [writing documentation](http://www.luminusweb.net/docs), and putting things together for that express purpose. I've even written [a couple of books](https://pragprog.com/book/dswdcloj2/web-development-with-clojure-second-edition) on this topic now.

Arachne aims to experiment with creating an easy to start with solution that will scale. Luminus is designed to scale, and it’s currently being used in production in the enterprise. It's not experimental in any way, it's an actual proven solution that exists today.

Luminus allows you to start fast and deploy out of the box, but it is also designed to be built on as you go. Like Arachne aims to do, Luminus already embraces modular design. It's built on top of battle tested libraries such as Ring and Compojure, but it doesn't lock you into doing things a particular way.

Luminus makes it trivial to swap things like the underlying HTTP server, templating engine, the database you're using, and so on. The core template provides a minimal skeleton app. This template can then be extended using hints to provide additional functionality.

### But is it modular?

Arachne has an ambitious goal to provide a way to specify the application using a data driven approach. The idea being that this makes it easier to swap different components in the existing project.

I’ve considered similar approaches for Luminus, but ultimately decided against it. First, I think that Ring middleware already provides an extremely powerful mechanism for injecting functionality in the request handling pipeline. This is where most of the changes will happen in your project. You might decide to swap out or change things like session handling middleware as your project evolves.

However, my experience is that in most cases it’s not possible to simply swap a component such as the database for a different one without having to change some code in the application.

For example, if I switch the templating engine, then I have to update my HTML templates. When I switch a database from SQL to Datomic, I have to rewrite the queries and the business logic. That’s where the most of effort will end up being spent. 

That said, the code that deals with any particular component in Luminus is minimal by design. So, the vast majority of the code you’d have to change would be the code that you’ve written yourself.

The one place I found it to be possible to provide swappable components is the underlying HTTP server. Luminus provides wrapper libraries for all the popular servers, and it’s possible to swap them out by simply changing the dependency in the project.

I think it would be possible to build things like authentication and authorization modules that are swappable. However, a generic solution is necessarily more complex than a focused one. A component that can be used in many different situations will always be more complex than one that solves a specific problem.

For this reason, I firmly believe that such design decisions should be left up to the user. The libraries should provide focused functionality, while the user decides how to put them together in a way that makes sense for their project.

### Conclusion

At the end of the day, Luminus isn’t based just on my experience, but also that of the contributors and the users over the years.. Arachne will be informed by Luke’s experience and that necessarily means that it will provide a new and interesting way to put together Clojure web applications.

Overall, I think it will be great to see a new web framework for Clojure. There is plenty of room for alternatives to Luminus, and Arachne could explore many areas that aren't the focus for Luminus at the moment. Therefore, I wholeheartedly urge you to support the Kickstarter so that we can have more choices for Clojure web development.


