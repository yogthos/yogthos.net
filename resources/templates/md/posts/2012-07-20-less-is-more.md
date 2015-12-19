{:title "less is more", :layout :post, :tags []}

An expressive language has many benefits. The most obvious one is that you have to write less code to solve your problem. The reason you write less code is often not because the syntax is more terse, but because you're using better abstractions. For example, instead of writing a loop, you can use an iterator function to do the work:

```clojure
(loop [count 0
         [head & tail] items]
    (if tail
      (recur (+ count head) tail)
      (+ count head)))

(reduce + items)
```

One non-obvious benefit of having less code is that it makes it much easier to throw code away. In a verbose language where you have to write a lot of code to solve simple problems, you tend to become attached to that code. In a language where you can express complex things in a relatively few lines, it's not a big issue to replace those with a few different lines. This encourages refactoring as you go, instead of waiting until you have a mountain of code accumulated and you really need to do something about it.