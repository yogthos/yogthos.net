{:title "Contrasting Component and Mount"
 :layout :post
 :tags ["clojure"]}
 
There was a recent wave of discussions on pros and cons of using Component and Mount approaches to state management. Both libraries aim to provide a clean way to manage stateful resources in the application. However, each one takes a very different approach.

Component is the currently accepted way to manage state, and it works well when you structure your application around it. However, it does require certain trade-offs in order to make the most of it. Let's take a look at some of the reasons you may wish to choose Mount over Component for your project.

### Managing the State with Component

Component uses the dependency injection approach to managing stateful resources in the application. A system map is used to track all the components and their relationships. This map is then passed around the application explicitly, and used to provide access to the resources.

This approach encourages coupling between the code managing the resources and the business logic. A common pattern is to pass the component system around the application. The system is injected from the top level, and then functions pick parts of the system to pass down until they're eventually used by a function that relies on a particular resource.

One side-effect of this design is that it becomes impossible to test any part of the application without having the resources available. Therefore, if we wish to run tests in the REPL, then we need to instantiate a separate system map using the test resources. This problem makes it important to be able to create multiple instances of the components at runtime.

### Component and the REPL

Since Component is based on protocols it doesn't play well with the REPL workflow, as changes to `defrecord` do not affect the instances that have already been created. The whole app needs to be restarted in order to make sure that the REPL is still in a good state.

This problem is discussed in detail by Stuart Sierra in his post on the [reloaded workflow](http://thinkrelevance.com/blog/2013/06/04/clojure-workflow-reloaded). I find that the reloaded workflow used with Component is much closer to TDD than the traditional Lisp style REPL driven workflow.

However, one of the advantages of working with a language like Clojure is that we shouldn't need to run tests all that often. Since development is primarily done using the REPL, we should have a good idea of what the code is doing while we're working on it.

RDD provides a very tight feedback loop. I can develop the features interactively, then create the tests based on the REPL session once the code is doing what I need.

There are only a handful of situations where I find it necessary to run the full test suite. I run tests before I commit code, I run tests on the CI server, but I don't find it necessary to rerun tests any time I write a bit of code during development. I certainly shouldn't have to reload the whole app for changes to take effect.

I like the guard rail metaphor Rich Hickey used in his [Simple Made Easy](http://www.infoq.com/presentations/Simple-Made-Easy) talk:

>"I can make changes 'cause I have tests!  Who does that?!  Who drives their car around banging against the guard rails saying, "Whoa!  I'm glad I've got these guard rails!"

This is a good reminder that the tests are primarily a sanity check. We should have confidence in our code because we understand it and are able to reason about it.

To facilitate understanding, most code in the application should be pure, and we shouldn't have to rely on any external resources to test such code. I think that it helps to treat core business logic as you would a library. It should be completely agnostic about where the data is coming from and where it's going.

However, Component encourages a different kind of design where business logic ends up being reliant on the resources. In this situation, it's no longer possible to test the business logic in isolation.

Finally, any functions that takes the system map as a parameter are invariably tied to it. This is at odds with treating functions as core reusable building blocks.

### The Mount Approach

Mount takes the approach of encapsulating stateful resources using namespaces. This leads to a natural separation between the code that deals with state from the pure core of the application logic.

When the core is kept pure, then it can be safely tested in isolation without having to provide any mock resources to it. This also makes the code reusable out of the box.

Mount makes it trivial to integrate into existing applications. The app doesn't need to be designed up front to take advantage of it, as it does with Component.

Since Mount doesn't rely on protocols, it doesn't impact the REPL driven workflow. There's no need for an elaborate setup to facilitate reloading the whole application any time a change is made.

The primary disadvantages of Mount are that it's not possible to create multiple instances of a resource, and that we have to be mindful not to couple namespaces representing resources to the business logic.

Conceptually, most resources in the application are singletons by their very nature. When we have a database connection or a queue, there is precisely one external resource that we're working with.

As I illustrated earlier, the primary reason for having multiple instances of a resource is testing. Mount provides a simple solution for running tests with alternate implementations as described in its [documentation](https://github.com/tolitius/mount#swapping-alternate-implementations). This facilitates practically the same workflow as Component, where an instance of the resource can be swapped out with another for testing. However, the bigger advantage is that we no longer need to have resources available to test majority of the code in the first place.

Another argument is that you may have different instances of the same type of resource. For example, an application might use multiple queues that all have the same API. In this case, we can use `defrecord` to define the class representing the API for the queue. We'll then manage the lifecycle of each instance using `defstate`.

While we do have to be mindful of our design when using Mount, the same is true for Component as well. For example, nothing stops us from putting the Component system in a var that's referenced directly. The same reasoning we use to avoid doing that should be used when working with Mount as well.

In general, I see very few downsides to using Mount and I see a lot of practical benefits, some of which I've outlined above.

### Conclusion

I think that both Component and Mount have their own sets of trade-offs. Component is a framework that requires the application to be structured around it. Conversely, it necessitates a TDD style workflow to work with it effectively.

On the other hand, Mount is not prescriptive about the workflow or application structure. I think this makes it a more flexible solution that's a great fit for many kinds of applications. The flip side is that we have to be more careful about how we structure the application as Mount is agnostic regarding the architecture.