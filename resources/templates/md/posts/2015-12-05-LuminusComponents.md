{:title "Managing State in Luminus"
 :layout :post
 :draft false
 :tags ["clojure" "luminus"]}

### The problem of State

Most real-world applications will interact with external resources such as databases. Typically, in order to interact with a database we have to initialize a connection when our application starts, use this connection to access the database, and then tear it down when the application shuts down. 

In some cases these resources may even depend on one another. We may be getting configuration from one resource and then using it to initialize another. A large application may have a number of different resources that are interdependent and have to be coordinated.

#### Using Component

One popular approach to addressing this problem is to use the [component](https://github.com/stuartsierra/component) library. Component creates a graph that describes all the resources and then we pass it around to any functions that rely on them. This library was originally developed to support the [reloaded workflow](http://thinkrelevance.com/blog/2013/06/04/clojure-workflow-reloaded) advocated by Stuart Sierra.

The advantage of this approach is that it allows us to keep the application code completely stateless and lets us inject the stateful resources at runtime. The two main benefits are that the core application logic remains pure and we can easily provide mock resources to it for testing. If you're interested in learning more about building applications based on component I recommend checking out the [Duct](https://github.com/weavejester/duct) framework by James Reeves that I covered in an earlier [post](http://yogthos.net/posts/2015-10-01-Compojure-API.html).

I think that's a fine approach for building applications, but I also think that there are tradeoffs that one has to buy into when using component.

Component introduces simplicity by providing a formal separation between pure and impure code, but also adds complexity in terms of the structure of the application.

The application has to keep a global component graph that tracks the relationships between the resources and pass it explicitly to any code that needs to interact with them. My experience is that this introduces boilerplate and indirection making the overall application structure more complex. Component also requires the developer to adopt a specific workflow to take full advantage of it.

Component can also be rather confusing for beginners and I have avoided using it in Luminus for that reason. However, the problems that component addresses are real and if we're not using component we still need a way to address them. For this reason Luminus uses the [mount](https://github.com/tolitius/mount) library to orchestrate the stateful resources in the application.

#### Using Mount

Unlike component, mount does not require us to structure the application in a specific way or to adopt a particular workflow to use it.

The library leverages the existing namespace hierarchy to resolve the resource dependencies. This approach obviates the need to keep a separate component graph and pass it all over the application.

Mount uses the `defstate` macro to define stateful resources. The macro allows specifying the code to initialize and tear down the resource by associating it with the `:start` and `:stop` keys. In case of a connection we would associate the code that initializes the connection in the `:start` key and the code that tears it down with the `:stop` key respectively.

Mount will look for any namespaces that define states with `defstate` and and compile a set of stateful resources based on that. The resources are started and stopped based on the order of reference of their namespaces.

Mount system is started by calling `mount.core/start` and stopped using `mount.core/stop`. This ensures that the lifecycle of the resources is managed in automated fashion and their relationships are all accounted for.

Like component, mount [supports the reloaded workflow](https://github.com/tolitius/mount#the-importance-of-being-reloadable) and even provides ways to restart parts of the application. Mount also supports [swapping in alternate implementations](https://github.com/tolitius/mount#swapping-alternate-implementations) for the resources. This provides a simple way to run tests with mock resources without having to restart the REPL.

### Structuring the Application

While mount provides us with a solution for managing the lifecycle of the components, we still need a way to ensure that our application is easy to reason about. Since mount does not enforce the separation between pure and impure code, we have to structure the application in such a way that side effects aren't mixed into the core application logic.

#### Encapsulating Resources

The approach I like to take in my applications is to keep the code that interacts with external resources at the edges of the application. The core business logic should be pure and testable, while anything that deals with side effects and external resources should be pushed to a thin layer around it.

I also find it useful to localize resource management in order to reduce coupling between components. For example, when I'm dealing with a database resource I'll create a namespace to manage it. This namespace will be responsible for handling the connection lifecycle internally and providing the connection to the functions defined in it.

Such a namespace provides an API for interacting with the resource for the rest of the application. Any functions calling this API do not have to be aware of its internal implementation.

My experience is that this approach allows compartmentalizing the application into self-contained components that can be reasoned about individually. When I update the internal implementation of a particular component the rest of the application does not need to be aware of the change.

An example of this would be changing the underlying resource. We may start writing the application by using a database directly, then realize that the functionality can be extracted into a shared service. When the mechanics of communicating with an external resource are internal to the component we can safely update it to use the new type of resource without affecting the rest of the application.

#### Organizing the Components

The workflows in web applications are typically driven by the client requests. Since requests will often require interaction with a resource, such as a database, we will generally have to access that resource from the route handling the request. In order to isolate the stateful code we should have our top level functions deal with managing the side effects.

Consider a concrete example. Let's say we have a route that facilitates user authentication. The client will supply the username and the password in the request. The route will have to pull the user credentials from the database and compare these to the ones supplied by the client. Then a decision is made whether the user logged in successfully or not and its outcome communicated back to the client.

In this workflow, the code that deals with the external resources should be localized to the namespace that provides the route and the namespace that handles the database access.

The route handler function will be responsible for calling the function that fetches the credentials from the database. The code that determines whether the password and username match represents the core business logic. This code should be pure and accept the supplied credentials along with those found in the database explicitly. This structure can be seen in the diagram below.

```
            pure code
+----------+
| business |
|  logic   |
|          |
+-----+----+
      |
------|---------------------
      |     stateful code
+-----+----+   +-----------+
|  route   |   |           |
| handlers +---+  database |
|          |   |           |
+----------+   +-----------+
```

Keeping the business logic pure ensures that we can reason about it and test it without considering the external resources. Meanwhile the code that deals with side effects is pushed to the top making it easy for us to manage it.

### Conclusion

Clojure makes it easy to structure the application in such a way that the core of the application logic is kept pure. Doing this is a very good practice and will help you keep your applications manageable as they continue to grow. While it's possible to formalize the handling of stateful resources, using libraries such as component, I personally have not found this to be necessary in my applications.

I hope this post provides a bit of an insight into how Luminus based applications should be structured for long term maintainability.
