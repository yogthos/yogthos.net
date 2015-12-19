{:title "all things being equal", :layout :post, :tags []}

You might have heard terms such as [anonymous functions](http://en.wikipedia.org/wiki/Anonymous_function), [first class functions](http://en.wikipedia.org/wiki/First-class_function),  [higher order functions](http://en.wikipedia.org/wiki/Higher-order_function), and [closures](http://en.wikipedia.org/wiki/Closure_%28computer_science%29). These might sounds mathy and imposing, but they're very simple ideas. In fact, I'll argue that they make the language simpler and more consistent.

In some languages there's a distinction between a function and a variable. You can assign variables, pass them in as parameters, and return them. Yet when it comes to functions, all you can do is define them and call them. 

If you take a moment to think about it, I think you'll agree that this distinction is fairly arbitrary. There's no practical reason why we shouldn't be able to do all the things we do with variables with functions. 

Let's look at some things that become possible once this distinction is erased. Sometimes we like to use values inline and not assign them to a variable, we usually do this because the value is only going to appear once, and we don't want to go through the ceremony of naming it.

If our language supports anonymous functions, we can do the same thing with a small piece of logic. If it's only needed in a single situation then we can make an anonymous function and call it directly:
```clojure
    ((fn [x] (* 2 x)) 5)
    10
```
Here we created an anonymous function which takes a value and multiplies it by 2, and we passed 5 to it as a parameter. Just as we name values which we reuse in multiple places, so can we name functions:
```clojure
    (def times-2 (fn [x] (* 2 x)))
```
and then call them by their name instead
```clojure
    (times-2 5)
    10
```
The other thing we said that we can do with variables is pass them as parameters to functions. By being able to pass functions to other functions, we're able to decompose our logic into smaller chunks. 

If we takes our `times-2` function and pass it in as a parameter to an iterator function such as map, it in turn can apply it to each element in a collection:
```clojure
    (map times-2 '(1 2 3 4))
    (2 4 6 8)
```
You might recognize this as the [strategy pattern](http://en.wikipedia.org/wiki/Strategy_pattern) from OO. Turns out that all the complexity in the pattern comes from the idea of treating functions as second class citizens. Which brings us to the idea of a first class function. All that means is that a function is treated no differently than a variable. The only other thing we haven't defined is the higher order function, `map` in the above example is such a function. Once again, there's nothing complicated about the concept. Any function which can accept another function as a parameter is a higher order function.

Finally, what happens if functions can return functions as output. There are many uses for this, but I'd like to focus on one that will be familiar from OO. When we create a class we often use a constructor to initialize some data that will be available to the methods of the instantiated object. 

In a functional language we can achieve this by having a function which takes some parameters and returns another function. Because the inner function was defined in scope where the parameters are declared it too can access them. Here's an example:
```clojure
    (defn foo [x]
      (fn [y] (* x y)))

    ((foo 2) 5)
    10
```
Function `foo` accepts parameter `x` and returns an anonymous function which in turn accepts a parameter `y` and multiplies them together. Function `foo` is said to _close over_ its parameters, and hence it's called a closure. Unlike a constructor a closure does not introduce any special cases. It's just a function that returns a result which itself happens to be a function.

Treating functions as first class citizens makes the language more uniform. Instead of having special constructs for specific cases, we have a general purpose tool that we can apply in many situations. 
