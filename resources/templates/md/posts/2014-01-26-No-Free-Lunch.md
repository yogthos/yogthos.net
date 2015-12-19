{:title "No Free Lunch", :layout :post, :tags ["clojure"]}

On paper static typing sounds strictly superior to dynamic typing. The compiler can track the data flow throughout our code and tell us when we're using the data incorrectly. This clearly eliminates a whole class of errors that are otherwise possible. What's more, types allow us to encode the business logic of our application allowing us to write code that's provably correct.

All this is unarguably correct, however these benefits do not come for free. One major problem is that static typing requires us to declare all the relationships globally. When you have global relationships a change at any level requires global refactoring at every level.

In my opinion, this makes static typing poorly suited for situations where your requirements are incomplete or subject to change, and in reality there are very few scenarios where your requirements are set in stone.

In most cases, we only care about a local contract between any two functions. What we want to know is that the function being called produces the type expected by the caller. A modification of a local contract should not cause global change in our code base.

Another cost of static typing is that it forces us to handle cases that are not part of the application workflow. For example, our code might have an undefined behavior, but the interface does not allow the user to access this state. This is a case of a tree falling in the woods when no one's around.

Regardless of the type system that you use, you will need to do functional testing in order to ensure that the business logic does what's intended. At the end of the day, the goal of the application is to handle the intended use cases as opposed to providing a proof of correctness.

When I look at the GitHub issues for my own projects such as [Selemer](https://github.com/yogthos/Selmer) or [markdown-clj](https://github.com/yogthos/markdown-clj/issues?page=1&state=closed), vast majority of them stem from lack of specification. Practically none of these issues would have been caught by the type system. Had I used a statically typed language to write these projects, I would've simply had to jump through more hoops to end up with the same result.

In my opinion the value added by a static type system has to be weighed against the complexity of the problem and the cost of errors. Since it's obviously useful in some cases and provides dubious value in others, an optional type system might provide the right balance. Static typing is a tool and it should be up to the developer to decide how and when to apply it.

With an optional static checker we can add types where it makes sense and leave the rest of the code dynamic. This is precisely the situation [CircleCI found themselves in](http://blog.circleci.com/supporting-typed-clojure/).
