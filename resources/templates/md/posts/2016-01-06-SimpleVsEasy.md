{:title "Simple Versus Easy"
 :layout :post
 :draft true
 :tags ["clojure"]}
 
A lot of focus in the Clojure community has been around making things simple. In many cases simple is taken to mean explicit. However, my experience is that this approach can often introduce a different kind of complexity.

Any implicit behaviors that are made explicit necessarily require additional code to be written and forces the application to be structured in a particular way.

and the problem with this interpretation is that complexity is bad in a particular context
the context is shared mutable state and knowing where things are referenced, it's unbounded complexity that grows with the app
this is completely different from complexity in understanding how a tool or a pattern works
that's fixed, once you understand it then it's not complex anymore
learning Clojure is complex for a lot of people, but once you get it then it's simple
Flag this message  Delete this message
but what it does internally is undeniably complex, take persistent data structures as an example
plain mutable data structures are much *simpler*, and they're explicit
but clearly the complexity in persistent data structures affords a ton of value

I think the focus has been predominantly on managing state. We've all seen the dangers of unchecked mutable state, and it's always the primary suspect when it comes to complexity.

However, there are other types of complexity as well.

I think perhaps it's also worth discussing what's intuitive. For example, I found that mount immediately clicked for me. So, even though it's more complex than component I intuit the way it works and the complexity isn't really a problem.
I tend to treat simple/complected distinction as a rule of thumb. I prefer things being simple in most cases, but sometimes I find the complexity actually adds value.
The other aspect of it is whether you're ending up with a fixed amount of complexity, or whether it will grow as your app grows.
The problem with mutable state is that the complexity tends to grow exponentially. The bigger the app gets the more permutations of things using the same variable there can be.
When it comes to complexity of learning a pattern of use then it's a different question. Once you understand it once, the complexity stays constant.

I've already [written a post](http://yogthos.net/posts/2015-11-28-TheSkyIsNotFalling.html) discussing the dangers of formalism in the context of type systems.

