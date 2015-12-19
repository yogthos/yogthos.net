{:title "I don't need a method to function", :layout :post, :tags []}

Instance methods are always associated with a particular object that may or may not exist. This means that before we can call a method we must first check if an object is null. This becomes especially tedious if you have nested objects. For example if we have a following situation:
```java
    users.getUser("foo").getAddress().getStreet();
```
the above code would be unsafe, since every single method call could potentially lead to a null pointer. This means that we have to instantiate and check each object individually:
```java
    String street = null;
    User user = users.getUser("foo");
    if (null != user)
       Address address = user.getAddress();
       if (null != address)
           street = address.getStreet();
```
Not only is this tedious and error prone, but it's also one more thing that you actively have to think about.

Let's compare this situation to the functional approach. In a functional language functions exist independent of data, much like static methods in OO. This means that we can't get a null pointer while calling a function. The author of the function can do all the error checking in the function **once**, and the user does not need to worry about it. When you chain such functions together, the null values can bubble up as the result:
```clojure
    (:street (:address (:foo users)))
```
This code will not throw any null pointer exceptions, and instead a null value will be returned. It has less noise, it's less error prone, and it's easier to read.
