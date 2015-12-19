{:title "The Sky Is not Falling"
:layout :post
:tags ["clojure"]}

A recent post by Elben Shira boldy proclaims [the end of dynamic languages](http://elbenshira.com/blog/the-end-of-dynamic-languages/). There was [a great followup](http://pointersgonewild.com/2015/11/25/have-static-languages-won/) by Maxime Chevalier-Boisvert that I'd like to expand on a bit in this post.

I think that people often forget that programming is a human endeavor. When all is said and done what really matters is whether you enjoy working with a particular language or not. Of course, different people like different things and hence the plethora of languages available today.

I would not presume to tell people that the way I develop is the one true way. I've found an approach that works for me, I know I'm productive with it, and most importantly I enjoy it.

The truth is that this is the case for everybody else out there as well. Anybody who tells you that they found the one true way is frankly deluded. There's no empirical evidence to show that the typing discipline is the deciding factor of code quality, and everybody out there is using their own anecdotal experience to find the workflow that works for them.

Proponents of static typing accept its benefits as axiomatic. However, I think that's a case of putting the cart before the horse. Let's take a look at the claims from the perspective of a dynamic language user.

### The Case for Static Typing

Static typing provides a way to formally track relationships in code and thus allows catching a certain class of errors at compile time. The advantage of this approach is that it becomes possible to guarantee that these types of errors cannot occur at runtime.

Many proponents of static typing argue that this is a common source of errors in dynamic languages and that it's not possible to write and maintain large codebases in absence of static types. It's common to see assertions such as the following:

[Programmers have come to embrace dynamically typed languages for prototyping and delivering large and complex systems. When it comes to maintaining and evolving these systems, the lack of explicit static typing becomes a bottleneck.](http://conf.researchr.org/event/POPL-2016/popl-2016-papers-is-sound-gradual-typing-dead-)

In practice, very little research has been done to determine whether this is a major source of errors for applications written in dynamic languages, and the few studies that are available don’t show anything conclusive in this regard.

Furthermore, there’s no evidence that real world projects written in statically typed languages produce superior results to their dynamic counterparts. In fact, some of the largest and most robust systems out there are written in dynamic languages such as Erlang:

[Erlang is used all over the world in high-tech projects where reliability counts. The Erlang flagship project (built by Ericsson, the Swedish telecom company) is the AXD301. This has over 2 million lines of Erlang.](https://pragprog.com/articles/erlang)

[The AXD301 has achieved a NINE nines reliability (yes, you read that right, 99.9999999%). Let’s put this in context: 5 nines is reckoned to be good (5.2 minutes of downtime/year). 7 nines almost unachievable ... but we did 9.](https://pragprog.com/articles/erlang)

Erlang is a poster child for robust and fault tolerant systems. However, plenty of large projects have been written in other dynamic languages as well. There's a good chance that a piece of software you rely on daily is written using a dynamic language and it works just fine.

### Complexity inherent in static typing

Since static typing sounds like a net win on paper, the obvious questions are why many people prefer dynamic languages and why hasn't static typing been decisively shown to be more effective.

The main drawback of static typing is that you're required to prove what you're stating to the compiler. Anybody who has done proofs knows that stating something is always simpler than proving it. In fact, many things are very simple to state, but are notoriously difficult to prove. Fermat's last theorem is a famous example of this.

Baking a proof into the solution leads to incidental complexity. Once you run into limits of what the type system can easily express then you end up having to write increasingly more convoluted code to satisfy it.

This results in code that’s harder to understand because it compounds the complexity of the problem being solved with the complexity of expressing it using the type system. Effectively, any statement we make in our program has to be accompanied by a proof of correctness to make it possible for the compiler to verify it. The requirement of proving that the code is self-consistent is often at odds with making it simple.

A concrete example of this would be the use of state monad to formally represent mutation in a language like Haskell. Here's what Timothy Baldridge has to say about his experience trying to apply this pattern in Clojure when working on the [core.async](https://github.com/clojure/core.async) library:

>[When I first wrote the core.async go macro I based it on the state monad. It seemed like a good idea; keep everything purely functional. However, over time I've realized that this actually introduces a lot of incidental complexity. And let me explain that thought.](https://groups.google.com/d/msg/clojure/wccacRJIXvg/tFAxZBuO0wMJ)

>[What are we concerned about when we use the state monad, we are shunning mutability. Where do the problems surface with mutability? Mostly around backtracking (getting old data or getting back to an old state), and concurrency.](https://groups.google.com/d/msg/clojure/wccacRJIXvg/tFAxZBuO0wMJ)

>[In the go macro transformation, I never need old state, and the transformer isn't concurrent. So what's the point? Recently I did an experiment that ripped out the state monad and replaced it with mutable lists and lots of atoms. The end result was code that was about 1/3rd the size of the original code, and much more readable.](https://groups.google.com/d/msg/clojure/wccacRJIXvg/tFAxZBuO0wMJ)

>[So more and more, I'm trying to see mutability through those eyes: I should reach for immutable data first, but if that makes the code less readable and harder to reason about, why am I using it?](https://groups.google.com/d/msg/clojure/wccacRJIXvg/tFAxZBuO0wMJ)

In a language that forces us to use a particular formalism to represent this problem there would be no alternative solution. While the resulting code would be provably correct, it would be harder for the developer to reason about its intent. Therefore, it's difficult to say whether it's correct in any meaningful sense.

Ultimately, a human needs to be able to understand what the code is doing and why. The more complexity is layered on top of the original problem the more difficult it becomes to tell what purpose the code serves.

As another example, let’s consider what we would need to understand to read an HTTP request using a Haskell web framework such as [Scotty](https://github.com/scotty-web/scotty). We'll quickly run into `ScottyM` type that's defined as `type ScottyM = ScottyT Text IO`. To use it effectively we need to understand the `ScottyT`. It in turn requires understanding the `ReaderT`.

Understanding `ReaderT` relies on understanding of monads, monad transformers and the `Reader` monad. Meanwhile, to understand the `Reader` we have to know about functors and applicatives. To understand these we have to understand higher kinded types and constructor classes. This leads us to type classes, type constructors, algebraic datatypes, and so forth.

All of this is needed to satisfy the formalisms of the Haskell type system and is completely tangential to the problem of reading HTTP requests from a client.

Of course, one might argue that Haskell is at the far end of the formal spectrum. In a language with a more relaxed type system you have escape hatches such as casting and unchecked side effects.

However, once you go down that road then it's only a matter of degrees with how relaxed a system you're comfortable with. At this point you've already accepted that working around the type system can make your life easier.



