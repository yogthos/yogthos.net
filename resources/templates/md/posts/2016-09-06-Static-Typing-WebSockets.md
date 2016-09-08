{:title "Static Typing vs WebSockets"
 :layout :post
 :tags ["clojure"]}
 
A [recent post](https://hashrocket.com/blog/posts/websocket-shootout) compared WebSocket server performance in Clojure, C++, Elixir, Go, NodeJS, and Ruby. Chris Allen wrote a [nice follow-up post](http://bitemyapp.com//posts/2016-09-03-websocket-shootout-haskell.html) where he implemented the benchmark using Haskell.

The initial results looked extremely favorable for Haskell. However, it turned out that the Haskell implementation failed to deliver messages reliably, [dropping 98% of the messages it received](https://github.com/hashrocket/websocket-shootout/pull/14). What's interesting is that this is exactly the kind of behavior we would expect Haskell type system to prevent from happening. So, how did the fact that messages were being dropped slip by completely undetected.

The answer is that Haskell provides escape hatches from its type system, and these are often used in practice to achieve reasonable performance. When we look at code in the [unagi-chan](https://github.com/jberryman/unagi-chan) library used in the Haskell implementation, we can see that it uses `unsafeInterleaveIO` to get the channel contents.

This is an example of an escape hatch that bypasses the type checker entirely. While Haskell is conceptually a pure language, the internal GHC implementation is imperative in nature. GHC runtime evaluates impure functions that produce side effects making the order of evaluation important. Functions like `unsafeInterleaveIO` expose the impure runtime to the user, and open the gate for all the types of errors we're familiar with from imperative languages.

The way GHC implements Haskell inherently precludes safety guarantees by its type system. The purity is effectively an honor system, and cannot be proved by the compiler. In other words, once we use a library that happens to use unsafe operations any guarantees that we get from the type system go out of the window.

### Types are not a specification

While Haskell type system can help ensure that our code is self-consistent, it clearly can't provide any guarantees regarding the behavior of third party code. Since most real world applications tend to rely on many third party libraries, it means that unless we know what each library is doing we can't ever be certain that our code will work as expected.

The developer can't possibly be expected to audit every library they use in their project to ensure that it behaves safely. Since most applications rely on large amounts of third party code, availability of mature and reliable libraries is a major factor when it comes to building robust applications.

While the benchmark in this example is trivial, it's a good example of real world problems many projects have to deal with. Most applications have to interact with the external resources such as queues, databases, and other services. Therefore, we need mature and tested libraries in order to accomplish these tasks effectively.

I think this is one of the major reasons why hosted languages have been gaining popularity in recent years. When the language relies on a mature ecosystem, such as the JVM, it inherits a lot of battle tested code along with it.

However, this problem exists in every language. Ultimately, we need to know what the code is doing, and clearly types don't provide us with enough information to really be sure the code is doing what was intended.

### Achieving correctness

The only way to know that the code is doing what was intended is to have a specification, and test the code against it. This is true pretty much for any language in use today. Tests allow us to validate complex properties that are difficult or even impossible to encode using most type systems.

Consider the trivial case of validating a user generated password. We need to check its length, combinations of characters it contains, and whether it matches the retyped password. All most type systems can tell us is that we have to pass the function a couple of strings and it will return a boolean.

To check any of the properties that prove that the function does what was intended, we need to come up with a specification and test the code against it. While the tests do not provide an exhaustive proof of correctness, they provide proof that the code satisfies the intended use cases.

An argument can be made that types save time in finding bugs when the tests fail. However, my experience is that it's often trivial to track down the actual problem once you're aware of it.

I think this is where the trade-off between static and dynamic languages lies. The former forces us to describe the types up front, and makes it easier to track down potential errors. Meanwhile, the latter approach allows us to skip this step at the cost of potentially having to do more work to find bugs later.

To the best of my knowledge nobody knows whether one approach is strictly more efficient than the other.  The overall amount of work appears to be comparable with both approaches. However, the nature of work is different, therefore each approach appeals to a different mindset.

One interesting approach is to generate types from tests [as seen in recent version of Typed Clojure](https://github.com/typedclojure/auto-annotation). Using tests to drive type generation has the potential to offer the best of both worlds. We can work with a dynamic language, and offload the work of figuring out the type relationships to a library. As long as we're diligent about writing tests, we get the types for free.

Another powerful tool for writing robust code is the REPL. When it's integrated with the editor, testing code as you write it becomes very natural. It's quite common for me to test functions as I develop them, then extract the REPL session into a test suite for the feature I'm working on.

### Takeaways

Even a strong type system, such as one found in Haskell, provides a very weak specification in practice. Just because the code compiles doesn't mean it's actually doing what was intended.

The type system does not help debugging many real world problems. The code in this benchmark worked as expected under small load, and started exhibiting errors when it was stress tested.

The ecosystem around the language is an important factor when it comes to productivity. When we use mature and battle tested libraries, we're much less likely to be surprised by their behavior.

Tests are ultimately the only practical way to provide a specification for the application. Behaviors that are easily tested can be difficult or impossible to encode using a type system.
