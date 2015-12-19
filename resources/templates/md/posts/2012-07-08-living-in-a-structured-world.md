{:title "living in a structured world", :layout :post, :tags []}

If you've seen any Lisp code before, you've probably noticed that it looks different from other languages in that the parens come before the function name, prefix notation is prevalent, and that functions are often nested inside one another. The technical term for this is that Lisp uses [s-expressions](http://en.wikipedia.org/wiki/S-expression). 

These might look awkward at first, and many newcomers immediately think that they can and should be improved upon. Surely it would be easy to write a preprocessor that would let you write code as you write it in other languages and then convert it to s-expressions. This is absolutely true and in fact there is one prominent attempt called [sweet-expressions](http://www.dwheeler.com/readable/sweet-expressions.html). Despite all that, the idea just doesn't catch on and I'd like to explore what the advantages of working with raw s-expressions are.

One immediate benefit is that Lisp syntax follows the [principle of least astnoishment](http://en.wikipedia.org/wiki/Principle_of_least_astonishment) very well. Any time you read code, it always follows the pattern of `(function-name arguments)`,  which makes for very consistent looking code. This helps reduce the mental overhead when reading and writing code, instead of worrying about language quirks you can focus on the actual problem you're solving.

Another benefit is that the code provides extra information about itself, which is not available in other languages. With s-expressions you can visually see how functions relate to one another. In essence the code is rendered as a tree representing the execution logic.

Finally, the s-expressions make editing code a completely different experience from other languages. Instead of working in terms of lines, you work in terms of functions. With a [ParEdit](http://emacswiki.org/emacs/ParEdit) style editor you can select code not by line but by function! Now you can easily select, move, and reparent pieces of logic. Editing code becomes like playing with Lego pieces and arranging them in different ways.

In my experience these things make the language more enjoyable to work with and the benefits far outweigh any perceived ugliness. After a while you don't even see the parens.