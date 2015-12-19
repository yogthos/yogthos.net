{:title "Why be conservative", :layout :post, :tags []}

[Steve Yegge](https://plus.google.com/110981030061712822816/posts) has made a post introducing the idea of liberalism and conservatism in programming languages. While it is an entertaining read I have to question the usefulness of the proposed metric.

In my opinion the language either gets out of your way and makes it easy to do what you need to do or it doesn't. I don't really care how it does it as long as at the end of the day I enjoy using it and I'm productive in it.

It can certainly be argued that Clojure is conservative in some ways. As has been pointed out in the results of the [2012 State of Clojure](http://java.dzone.com/articles/results-2012-state-clojure) survey, some people find the process for contributing to the language too restrictive. Rich Hickey is very cautious about adding new features and about the way they're added to the language.

But I would argue that this is in fact a good thing and the end result is a cleaner and more consistent language. Destructuring is a concrete example of this. At one point people were asking for named arguments for functions and Rich resisted the idea of adding them. Instead, we got destructuring which is a more powerful and general purpose tool. It can be used for naming arguments in functions, but it can also be used for many other things as well.

Let's consider what the result would have been if Clojure was more liberal about adding features, and named arguments were in fact added. There would now be two separate ways to do the same thing, each with its own quirks. Different code bases would use different rules for naming function parameters and you would have to make adapters to make them work together.

The more eagerly features get accepted into a language, the more likely they it is that the solution won't be elegant or general purpose. Which means that inevitably a new feature needs to be added to cover the case which isn't adequately addressed by the original attempt. 

In my opinion this quickly leads to having a crufty syntax, and requires a lot of mental overhead to work with code written by others. Since, some people will prefer this or that particular style of doing things you have to be aware of every quirk and their interactions.

Fact of the matter is that Lisp is already phenomenally powerful, more so than most languages out there. It would seem prudent not to be rash about trying to improve it. 


