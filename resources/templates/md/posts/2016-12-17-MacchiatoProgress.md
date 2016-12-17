{:title "Frameworks, Foundations, and Macchiato"
 :layout :post
 :tags ["clojurescript" "node"]}

I've been making steady progress on Macchiato in the past weeks. This post will discuss some of my thought process and design decisions I settled on during this time.

One of the core questions is what problem the project aims to solve, and how it aims to do that.

The goal for Macchiato is to provide a way to build Node web applications using CojureScript. Ultimately, I'd like to produce something that's immediately usable and works well out of the box. The best way to accomplish that is to leverage the existing work in this domain.

The Ring stack is the most popular platform for developing Clojure applications on the JVM, and rightfully so in my opinion. It does an excellent job of abstracting the HTTP protocol, and provides a simple and intuitive API to the user.

Ring added async handler support in version 1.6, making it possible to implement compatible HTTP handlers on top of Node. This in turn allowed to port the core middleware stack to Macchiato.

As I was porting [ring-core](https://github.com/ring-clojure/ring/tree/master/ring-core/) on Node, I've come to realize that Ring middleware libraries have a lot in common with framework modules.

These libraries are meant to be used together in a standard way, they're designed to compose, and they're often built on top of each other.

However, the Ring stack acts as a foundation rather than a framework. To understand this idea, let's first look at the traditional framework approach.

### Frameworks

The core problem the frameworks attempt to solve is to provide a standard way to build software where the user can focus on writing the code that's relevant to their application. Meanwhile, the framework attempts to take care of all the incidental details around it.

The way traditional frameworks, such as Spring, accomplish this is through inversion of control. However, since the connections are no longer expressed directly in code, it makes it difficult to navigate them clouding the logic of the application.

Another problem with this approach is that the framework necessarily has to make a lot of decisions up front. Yet, a general purpose framework also has to be flexible enough to accommodate many types of application.

A framework typically turns into an exercise in designing a solution without knowing the problem. My experience is that it's not an effective way to write software in practice.

However, I think that the problem the frameworks attempt to solve is real. Having to artisanally handcraft each application from ground up is tedious and error prone.

### Foundations

A better way to approach this problem is by addressing the known common needs. The key insight of Ring is that majority of reusable work is centred around processing the incoming HTTP requests and outgoing responses.

Ring provides a simple core that different middleware can be attached to in order to extend its functionality. We can add middleware that facilitates authentication, sessions, and so on. [Buddy](https://github.com/funcool/buddy), [compojure-api](https://github.com/metosin/compojure-api), and [Sente](https://github.com/ptaoussanis/sente) are all great examples of this approach in practice.

One of the downsides of the library approach is that libraries aren't aware of one another, and the user has to glue them together. However, Ring middleware stack is not just a set of random libraries. Since Ring defines what the request and response must look like, it informs the design of libraries built on top of it. 

The Ring stack is a mature and battle tested foundation for building the rest of the application on top of. At the same time, it doesn't attempt to guess the problems that are specific to your application. You're free to solve them in a way that makes sense to you.

### Macchiato

Macchiato implements Ring 1.6 async handlers on top of the `ClientRequest` and the `ServerResponse` classes exposed by the Node HTTP module. Using the same API provides a consistent experience developing web applications on both platforms, and facilitates code reuse between them.

One immediate benefit of making Macchiato compatible with Ring was the ability to leverage its test harness. As I port the middleware to Node, I'm able to verify that it still behaves the same as the original. Going forward, it will be possible to write cljc middleware that targets both Ring and Macchiato.

Alongside the creation of the core libraries, I've been working on the template that packages everything together for the user. This template is informed by my experience working on Luminus and uses many of the same patterns and structure. If you're already familiar with Luminus, then you'll feel right at home with Macchiato.

As I noted in the last [post](http://yogthos.net/posts/2016-11-30-Macchiato.html), Macchiato development experience is very similar to working with Clojure on the JVM, and Chrome devtools along with [Dirac](https://github.com/binaryage/dirac) look promising for debugging and profiling apps.

Meanwhile, the project has already garnered interest from the community. [Ricardo J. Méndez](https://numergent.com/opensource/) has been working on creating a [HugSQL style database access library](https://github.com/macchiato-framework/macchiato-sql), and [Andrey Antukh](https://github.com/niwinz), has been working on the [dost](https://github.com/funcool/dost) crypto library.

It's great to see such prominent members of the community take interest in the project in the early stages. My hope is that as Macchiato matures we'll see many more supporting libraries built around it.

There's now a `#macchiato` channel on Clojurians slack. Feel free to drop by and discuss problems and ideas.

If you're looking to contribute to an open source project, Macchiato is a great opportunity. The project is still in the early days and there are many low hanging fruit. The project needs more tests, libraries, and documentation. This is a great time to make an impact on its future direction.

