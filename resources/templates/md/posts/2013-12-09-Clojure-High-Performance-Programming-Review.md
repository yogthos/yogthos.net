{:title "Clojure High Performance Programming Review",
 :layout :post,
 :tags ["clojure"]}

First thing I'd like to say is that I'm very excited by the shift in nature of Clojure books that are coming out. There are already many excellent books about the language itself. Some of these include [The Joy of Clojure](http://www.amazon.com/The-Joy-Clojure-Michael-Fogus/dp/1617291412/), [Programming Clojure](http://www.amazon.com/Programming-Clojure-Stuart-Halloway/dp/1934356867), and [Clojure in Action](http://www.amazon.com/Clojure-Action-Amit-Rathore/dp/1935182595).

This year we can add [Clojure Data Analysis Cookbook](http://www.amazon.com/Clojure-Data-Analysis-Cookbook-Rochester-ebook/dp/B00BECVV9C), [Clojure Cookbook](http://clojure-cookbook.com/), my own [Web Development With Clojure](http://pragprog.com/book/dswdcloj/web-development-with-clojure), and [Clojure High Performance Programming](http://www.amazon.com/Clojure-Performance-Programming-Shantanu-Kumar-ebook/dp/B00GTE1RVW) to the roster. All these books focus on applying the language in the real world.

To me this indicates that developers are moving from simply experimenting with the language to actually using it professionally. The results from the [2013 State of Clojure & ClojureScript](http://cemerick.com/2013/11/18/results-of-the-2013-state-of-clojure-clojurescript-survey/), where more than half the respondents reported using Clojure at work, appear to corroborate this idea.

One of the things that makes Clojure attractive is the fact that it's one of the more performant dynamic languages. As can be seen in the recent round of [TechEmpower Benchmarks](http://www.techempower.com/benchmarks/), Clojure web frameworks fare quite well compared to the popular offerings in Ruby and Python. Since performance is a major factor in using Clojure, a book discussing high performance programming is a welcome addition.

The book starts off by introducing the reader to performance use case classification. It does a decent job of explaining the background concepts and the vocabulary that will be used throughout.

Different types of scenarios are discussed and their related performance concerns. For example, when we deal with user interfaces, responsiveness is our main concern. On the other hand if we're doing data-processing then we want to optimize CPU and memory usage.

The author then moves on to discuss how common Clojure idioms impact the performance of the application. Understanding what goes on behind the scenes helps reason about potential pitfalls down the road.

There's a good discussion about the explicit use of `loop/recur` over higher order functions that illustrates a way to squeeze out additional performance. In another section the author goes on to explain the impact of laziness on performance in functional languages. 

There are also tips regarding the use of different data formats. One example compares the benefits of EDN over JSON. EDN can save memory by using interned symbols and keywords, while JSON uses string keys which will not be interned. The author explains that in addition to saving memory, interning also avoids heap usage and this helps minimize garbage collection. This is something you would definitely want to consider if you were working with a high performance application.

The techniques used by some of the popular libraries, such as [Nippy](https://github.com/ptaoussanis/nippy), are examined to see how they achieve high performance. These kinds of real world examples are very helpful. Not only do we learn about the theory, but we also get to see how it's applied in practice.

In general, the book covers a wide range of topics, but only offers a superficial overview for many. The reader will most certainly need to do further research in order to apply many of the concepts discussed.

If you're looking for a refresher or a primer on the topics discussed, then it's not a bad place to start. However, if you're looking for a comprehensive discussion on doing high performance programming with Clojure, you'll likely be left wanting.