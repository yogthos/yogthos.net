{:title "Clojure Data Analysis Cookbook Review",
 :layout :post,
 :tags ["clojure"]}

I was recently asked to review the [Clojure Data Analysis Cookbook](http://www.packtpub.com/clojure-data-analysis-cookbook/book). Data analysis happens to one of the major niches where Clojure has been gaining popularity. However, the documentation on the subject is far from focused. 

The book provides a collection of recipes for accomplishing common tasks associated with analyzing different types of data sets. It starts out by showing how to read data from a variety of sources such as JSON, CSV, and JDBC. The next chapter provides a number of examples of how to sanitize the collected data and sample large data sets. After covering loading and sanitizing the data, the book discusses a number of different strategies for processing it.

Some of the highlights include using the Clojure STM, parallel processing of the data, including useful tricks for partitioning, using [reducers](http://clojure.com/blog/2012/05/08/reducers-a-library-and-model-for-collection-processing.html), and distributed processing with Hadoop and Casalog.

I found the sections on handling large amounts of data particularly interesting. Often times, it's easy to come up with a solution that works for a small data set, but doesn't scale to handle large amounts of data. One of the techniques the book discusses is the use of lazy sequences. Another example is using heuristics to decide how to partition large data sets data sets effectively.

The book closes with a chapter dealing with the presentation the processed data. First, it covers using Incanter charts and then shows how to display the results in the browser with ClojureScript and [NVD3](http://nvd3.org/).

For the most part, the book is very much example oriented. The examples are accompanied by explantation of how they all fit together. If you're like me and like to get hands on experience then I think you'll like the style of the book.

The examples are short in size and easy to understand. I found that the best way to work through the book was by following along with a REPL.

The book also introduces the reader to a number of libraries. Some, such as [Incanter](http://incanter.org/) are well known, while others like [parse-ez](https://github.com/protoflex/parse-ez) less so. In my experience, the documentation for many Clojure libraries is often lacking. The recipes in the book serve as a good reference for how to make the most of the tools available.

I would say one missed opportunity in the book is that the examples don't seem to build on each other. You'll see many examples of doing specific tasks, but they will tend to be self contained and don't build up to anything more substantial. 

I suspect this was done in order to keep content accessible so that the reader can look at any section without having to have read the others. Conversely, don't expect to see examples of how to structure your projects and build applications end to end.

Overall, I would say this book is aimed at somebody who is already comfortable using Clojure and would like to learn some of the more advanced techinques for working with data processing and analysis. If you're thinking of using Clojure for analyzing your data sets this book will likely save you a lot of time and serve as a handy reference down the road.