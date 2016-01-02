{:title "Web Development with Clojure 2nd Edition"
 :layout :post
 :tags ["clojure" "luminus" "book"]}

I'm glad to report that the second edition of Web Development with Clojure is just around the corner. The beta release is planned for January the 13th, and then I'm hoping to have the final release shortly after. The second edition took a bit longer than I anticipated, but I think the wait will be worth it.

### What to Expect

The primary goal of the book is to provide a solid introduction to the world of Clojure web development. Clojure community is growing rapidly and most new users come from languages such as Java, Ruby, and Python.

My aim is to illustrate how to build typical web applications using Clojure in a style that's friendly to those who come from using a mainstream language. In order to keep the material accessible, I deliberately chose to focus on the core concepts and avoid some of the more advanced topics. Conversely, if you're already familiar with Clojure and would like to get into web development then the book will serve as a great introduction.

The first edition of my book came out at the time when Clojure web stack was in a great deal of flux. [Noir](http://www.webnoir.org/) micro-framework just got deprecated, Cognitect announced [Pedestal](https://github.com/pedestal/pedestal), and ClojureScript was in its infancy. It was hard to predict where things would go from there.

Much has changed in the past year in Clojure web ecosystem, and the second edition of the book reflects that. While the first edition was fairly unopinionated and gave a broad overview of different libraries, the new version primarily focuses on the [Luminus](http://www.luminusweb.net/) stack.

Majority of the tools and libraries I cover are the ones I've used professionally to build real world applications. This naturally means that there is an inherent bias towards my workflow and the way I like to build applications. On the other hand, if you're new to building Clojure web applications it's helpful to learn using a particular workflow that you can adjust to your needs as you get comfortable.

Just like the first edition, the book is based around projects that illustrate how to accomplish different tasks in a typical web app. Each chapter introduces a particular concept and gets the reader to work through it by building a project from scratch. By the end of the book the reader should be comfortable writing many typical web applications using Clojure and have the background to explore further on their own.

### Topics Covered

The book will consist of the following chapter:

* #### Getting Your Feet Wet
  *  takes the reader through setting up the environment and building a simple application using Luminus
* #### Clojure Web Stack 
  * takes a step back and looks at Ring and Compojure in detail
* #### Luminus Architecture
  * provides an overview of the Luminus template and ways to organize your projects
* #### Add ClojureScript
  * illustrates how to convert the applications from the first chapter to a SPA style app using Reagent
* #### Real-time Messaging With Websockets
  * illustrates how to use Websockets in a Clojure/Script application using Sente
* #### Writing RESTful Web Services
  * covers the basics of using the [compojure-api](https://github.com/metosin/compojure-api) library to provide [Swagger](http://swagger.io/) style service API
* #### Database Access
  * introduces clojure.java.jdbc and Yesql, and how to use these libraries to work with a relational database
* #### Picture Gallery
  * ties all the above concepts together by working through a picture gallery application
* #### Finishing Touches
  * covers testing and packaging the application for deployment

The book will also contain a number of appendices that deal with topics such as NoSQL databases.

### What's Not Covered

As Clojure web ecosystem continues to evolve, many new tools and libraries, such as the [JUXT stack](https://github.com/juxt), have appeared just this year. While I would love to cover them all, that simply wouldn't fit the goals I set for this project.

One notable omission from the book is [Om Next](https://github.com/omcljs/om). First, I'd like to say that it's a fantastic library and I think very highly of it as well as the ideas behind it. However, I simply haven't used it in anger as I have Reagent. I also think that Reagent is the simpler of the two libraries and therefore more suitable for beginners. I hope that the book will provide a solid foundation for the reader to explore libraries like Om on their own.






