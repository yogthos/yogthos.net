{:title "Data Focused"
 :layout :post
 :tags ["clojure"]}

One interesting part I noticed about working with Clojure is that I practically never look for solutions to problems on Google or StackOverflow. I might google to see if a library exists for accomplishing a particular task, but I rarely end up having to google how to do a specific task.

This got me thinking about why that may be since I used to do that commonly back when I worked with Java. I think the key reason is that Clojure encourages writing code that operates on plain data.

### Object Oriented Approach

Object oriented languages, such as Java, encourage encapsulating the data in domain specific abstractions. Rich Hickey discusses this in detail in his excellent [Clojure, Made Simple](https://www.youtube.com/watch?v=VSdnJDO-xdg) talk. The OO approach ultimately leads to creation of frameworks that provide formalized ways to tie all the different domain abstractions together.

The problem with frameworks is that they impose a particular workflow on the user. However, in most cases there are many valid ways to solve a particular problem. The approach that the framework takes is just one way to do things and not necessarily the best way. If you happen to think about a problem differently from the authors of the framework then using it will not feel intuitive.

When you encounter a problem then you either have to spend the time to understand the internals of the framework and its design or simply memorize how different tasks are accomplished.

Understanding the internals of a complex piece of software is an arduous process that can take a long time and it's often time that you do not have. Conversely, having to understand the internals typically indicates that the abstraction you're working with is a leaky one.

This is where googling comes in. You know what your problem is, you know how you would solve it given the time, but you don't know how the authors of the framework expect you to solve it using their approach.

Since the choice of the solution completely arbitrary, there's no way for you to logically deduce what it is. In many cases the only realistic option is to hope that someone else ran into a similar problem already and see how they solved it within the context of the framework.

### Data Centric Approach

Clojure takes the approach of keeping the data and logic separate. Instead of building local abstractions for each domain as we do with objects, all the functions operate on a common set of data structures. When a function is called its output can be used in a new context without any additional ceremony.

Since all Clojure libraries use the same core data structures, it's trivial to take the output of one library and pass it as input to another. Using the REPL we can quickly see how a particular library behaves and what output it generates.

This approach allows the user to find the libraries that fit the problem they're solving and then compose them in the way that makes sense in their particular scenario. The same core pattern of composing data transformations can be applied at different resolutions within a project.

At the lowest level we have functions as our building blocks. We combine these in different ways to transform the data on the small scale.

Once we have a number of related functions that represent a particular domain we combine them into a namespace, and then we pass the data between the namespaces to move data from one domain to another.

Libraries are simply collections of namespaces, and we use the same pattern when  transform the data by combining them. A great example of this would be the [ring-defaults](https://github.com/ring-clojure/ring-defaults/blob/3dca3756a33892f607c45bc4eb582796e4997dd9/src/ring/middleware/defaults.clj#L90) library that chains a number libraries to achieve complex transformations of HTTP requests and responses.

Finally, at the top level we may have multiple projects passing data between each other in form of services. This approach is becoming increasingly popular in the industry as seen with the micro-services movement.

With Clojure, the focus is always on the data. When solving a problem, all we have to do is figure out how we need to transform the data and then find the appropriate building blocks for our problem.

Focusing on the data helps keep code simple and reusable without introducing unnecessary indirection into the process. I think this is the key reason why it's possible to work with Clojure without having to constantly memorize new patterns to solve different kinds problems.
