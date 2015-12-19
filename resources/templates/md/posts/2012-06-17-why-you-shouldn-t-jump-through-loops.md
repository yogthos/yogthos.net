{:title "why you shouldn't jump through loops", :layout :post, :tags []}

In Java passing logic as a parameter requires an inordinate amount of work and it's never the first choice to do so. So in most cases you're better off just writing a loop and doing the null check in it. Let's look at a concrete example of what I'm talking about here. Let's say we want to filter collections based on a predicate. The standard way you would do that in Java is to write a loop:
```java
public static List<Integer> filterEven(Collection<Integer> col) {
    if (null == col) return null;
    List<Integer> result = new LinkedList<Integer>();
    for (Integer i  : col) {			
        if (i % 2 == 0) result.add(i);			
     }		
     return result;
}
```
then if later I need to filter odd numbers I'll probably write another loop that looks almost identical except for the actual test. Obviously, the looping logic should be abstracted here, but let's look at what's involved in doing that in Java:
```java
public interface Predicate<T> {
    public boolean matches(T t);
}

public class EvenPredicate implements Predicate<Integer> {
	
    public boolean matches(Integer i) {
 	return i % 2 == 0; 
    }			
}

import java.util.Collection;
import java.util.LinkedList;
import java.util.List;

public class Filter {

    public static <T> List<T> filterCollection(Collection<T> col, 
                                          Predicate<T> predicate) {
        List<T> result = new LinkedList<T>();
	    for (T t : col) {			
                    if (predicate.matches(t)) {
                        result.add(t);
                    }
            }		
            return result;
    }
}
```
That's a lot more work than just writing a loop, and unless you saw this pattern many times you probably wouldn't consider doing it. Now let's compare this to a language like Clojure, where I would use a higher order function and pass in the matcher without having to do any preliminary setup:
```clojure
(filter even? (range 10))
```
what if I wanted to write a loop to do that
```clojure
(loop [nums (range 10)
       even-nums []]
    (if (empty? nums)
        even-nums
        (recur (rest nums) 
                  (if (even? (first nums)) 
                     (conj even-nums (first nums)) even-nums))))
```
all of a sudden the situation is reversed, it's _a lot_ more code to do explicit looping, and it's trivial to use a higher order function to do this task. So the language encourages you to write code through function composition by design. Being able to easily separate iteration from the logic applied inside it means that we can write code that's shorter, cleaner, and less error prone.

