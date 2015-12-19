{:title "why all the parens", :layout :post, :tags ["clojure"]}

A common complaint you hear from people about Lisp is that there are too many parens. Let's compare what's involved in writing a Java method to writing a Clojure function:
```java
    public static void foo(String bar, Integer baz) {
        System.out.println(bar + ", " + baz);
    }
```
```clojure
    (defn foo [bar baz] 
      (println bar ", " baz))
```
The number of parens is exactly the same, but there's clearly more noise in the Java version. In my opinion the noise adds up and it distracts from the intent of the code. The more code you have the harder it is to tell what it's doing and conversely the harder it is to spot bugs in it. I'll illustrate this with a concrete example. 

The problem is to display a formatted address given the fields representing it. Commonly an address has a street, a city, a postal code, and a country. We'll have to examine each of these pieces, remove the null and empty ones and insert some separator between them.

So given something like

    street: 1 Main street
    city: Toronto
    posal: A1B 2C3
    country: Canada

we'd like to output

    1 Main street, Toronto, A1B 2C3, Canada

we should obviously handle empty fields and not have *,,* if the field isn't there, and we should make sure we handle nulls in case the whole address is null or some fields in the address are null.

Let's first examine how we would write this in Java:
```java
    public static String concat(String... strings) {
        if (null == strings) return null;
        StringBuffer sb = new StringBuffer();
        for (String s : strings) {
            if (null == s || s.equals("")) continue;
            sb.append(s);
            sb.append(',');
        }
        String s =  sb.toString();
        return s.substring(0, s.lastIndexOf(','));
    }
```
* lines of code : 11
* parens: 26
* curly braces: 4
* semicolons: 7
* colons: 1
* dots: 6 

Now let's compare this to Clojure:
```clojure
    (defn concat-fields [& fields]
      (apply str (interpose "," (remove empty? fields))))
```
* lines of code : 2
* parens: 8
* brackets: 2

The Clojure version has significantly less code, and a lot less noise. In addition, we didn't have to do any explicit null checks in our code, and we were able to write the complete solution simply by composing together functions from the standard library!

One very important difference between the Java version and the Clojure version is that the Java version talks about **how** something is being done, while the Clojure version talks about **what** is being done. In other words, we have to step through the Java version in our heads to understand what the code is doing. 

In the Clojure version this step is not present because the code says what it's doing, and all the implementation details have been abstracted from us. This is code reuse at work, where we can write simple functions that do one thing well and chain them together to achieve complex functionality. 

This bears a lot of resemblance with the Unix philosophy: "[Write programs that do one thing and do it well. Write programs to work together. Write programs to handle text streams, because that is a universal interface.](http://en.wikipedia.org/wiki/Unix_philosophy)" Except in our case we're dealing with functions instead of programs and common data structures as a universal interface in the language.