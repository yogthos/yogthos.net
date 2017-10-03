{:title "Power of Macros", :layout :post, :tags ["clojure"]}

Lisps are famous for having powerful metaprogramming facilities derived from their homoiconic nature. Core language consists of a small set of built in primitives, and the rest is implemented using macros and functions in the standard library.

Since these same tools are available to the users, anybody can easily extend the language to add semantics for their problem domain. This is the aspect of macros that's discussed most often.

While this is certainly the case, Clojure community tends to discourage using macros if they can be avoided. The rationale behind this being that macros introduce additional complexity, and Clojure values simplicity. I generally agree with this sentiment, and I find that I tend to use macros sparingly myself. However, saying that macros shouldn’t be overused is not the same as saying they shouldn’t be used at all.

One place where macros work well is library APIs. Libraries that express a particular domain can create a DSL in their API that cleanly maps to that domain. [Compojure](https://github.com/weavejester/compojure), [Specter](https://github.com/nathanmarz/specter), and [Clara Rules](http://www.clara-rules.org/) are great examples of effective macro use. Such libraries are a powerful demonstration of users extending semantics of the language.

Since most ideas can be expressed via libraries, it becomes possible to experiment with different approaches to solving problems without modifying the core language. Extending the language through libraries has the advantage of keeping these extensions contained. It also lets them fade away when you no longer use them.

Clojure has been around for a decade now, and the core language hasn't changed much in that time. Some new features have been added, most notably reducers and transducers, but overall the language has stayed small and focused. In fact, I've even seen concerns that Clojure is stagnating because features aren't being added at the rate of other languages.

The idea of using libraries to add features is used by the Clojure core team as well. Consider the example of the [core.async](https://github.com/clojure/core.async) library that brings Go channel semantics and the CSP programming model to Clojure.

Perhaps, in time a better idea will come along, and core.async library will become deprecated. At that point developers would stop using the library and move on to use whatever happens to replace it.

Meanwhile, existing projects will not be affected as they can continue using the library. The community will move on, and most people won't have to learn about core.async semantics. This cycle may happen many times with many different ideas, without any baggage being accumulate by the language itself.

Unfortunately, mainstream languages are designed in a way where it's not practical to add new features without updating the language specification to accommodate them. Popular languages such as Java, Python, and JavaScript have accumulated a lot of complexity over the years.

As usage patterns change, new features are being added, while existing features become deprecated. Removing features is difficult since many projects in the wild end up relying on them, so they're typically left in place.

Having lots of features in a language can seem like a positive at first glance, but in practice, features often turn into [a mental burden](http://yogthos.net/posts/2013-08-18-Why-I-m-Productive-in-Clojure.html) for the developer. Eventually languages become too large to understand fully, and developers settle on a subset of the features considered to be the current best practice. 

In my opinion, this is the real power of homoiconicity. A language that can be extended in user space can evolve without accumulating baggage. New ideas can be implemented as libraries, and later discarded when better ideas come along. The end result is a small and focused language that doesn't sacrifice flexibility.

