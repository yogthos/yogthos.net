{:title "Temporally oblivious", :layout :post, :tags []}

Objects are state machines, yet no mainstream OO language ensures the consistency of the internal state of the object over time. This means that in a multi-threaded environment it's possible to see the internal state of the object while it's being updated. What's even worse is that even if you don't see a partial state, you might be seeing an unexpected state, since someone else with a reference to the object might have updated it for their use, which conflicts with the way you're using it.

The whole situation is fairly messy, but what is the alternative you might ask. My answer would be not to use in place mutation unless absolutely necessary. Instead it's much better to use [persistent data structures](http://en.wikipedia.org/wiki/Persistent_data_structure), which *are* temporally aware. A persistent data structure works in a fashion akin to version control. Any time a change to the data is made, a delta is created between the existing data and the new data. From user perspective you're simply copying the data, but you're only paying the price of the change.

This concept turns out to be very powerful as it inherently contextualizes any changes. It also allows doing things like rollbacks trivially as you just have to unwind your operations to see a previous state.  
