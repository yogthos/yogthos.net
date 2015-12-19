{:title "subject to change", :layout :post, :tags []}

The OO world view requires us to classify data in order to work with it. For example if we're talking about a person, we might create a `Person` class and add some fields to it, such as `age`, `name`, and etc. Then we'll create instances of this class and use them in our program.

The problem with this approach is that the classification is only meaningful within a particular context. The classification is not inherent to the data itself, but rather it's a transient view of the data at a specific time in a particular domain.

When we create a class we make assumptions about the context in which the data will be used. These assumptions are often incomplete, and even when they are, the nature of the problem can change over time. The requirements may change, new requirements might come up, or we might have simply misunderstood the problem when we designed our classes.

The way OO deals with this is by remapping the classes to a new domain. We might extend the class, write a wrapper, or use an adapter pattern to bridge the contexts. But this is solving a problem we ourselves have introduced by assigning a permanent  classification to our data.