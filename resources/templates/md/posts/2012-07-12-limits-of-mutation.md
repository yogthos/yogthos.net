{:title "limits of mutation", :layout :post, :tags []}

When you start learning functional programming you will quickly notice that you can't simply mutate data in place as you might be used to. Initially you might find this odd and restrictive, but it turns out there are also some tangible benefits to this approach.

Mutable data structures are very simple in nature. They reference a location in memory where some value can be stored, when that value changes the old one is simply replaced with the new.

[Persistent data structures](http://en.wikipedia.org/wiki/Persistent_data_structure) create revisions of the data when changes are made. We pay a small penalty in performance compared to in place mutation, but we gain a history of changes that exists as long as its referenced somewhere. 

This means that if a function accepts some data as a parameter, you don't have to worry if anybody else is referencing that data when you work with it. Any time you change the data you get a new version without paying the penalty of copying it. By contrast, we always have to be aware if a reference may be used else where when working with mutable data. By removing this worry, we can reduce the scope of things that we need to keep in our heads when trying to understand what a particular piece of code does. 

The benefits stack up as your project grows, as it becomes infeasible to keep the totality of the code in ones head. And it's a huge benefit when working in a threaded environment and shared data can easily be corrupted.

What might seem like an inconvenience at first turns out to be a net benefit. Ensuring that the data is not modified outside the intended context has been offloaded to the language instead of being done by you manually. I would liken this to use of garbage collection, where the language is responsible for most memory reclamation. In both cases it's better to let the machine do tasks that can be automated leaving you to solve the real problems.





