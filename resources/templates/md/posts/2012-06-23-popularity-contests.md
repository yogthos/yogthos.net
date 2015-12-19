{:title "popularity contests", :layout :post, :tags []}

The argument that Lisp is not popular because it's somehow a bad language is not really sound. A lot of great technologies have lost out to inferior ones because of poor marketing. The Lisp community has not in general been great at marketing the language, and it is viewed as downright scary by majority of people. 

It also doesn't help that there is no definitive standard distribution of Lisp, or a comprehensive standard library. Most people aren't going to jump through hoops to learn an esoteric language. So, it is no surprise that there aren't a lot of big commercial Lisp projects. It becomes a catch 22, where due to lack of Lisp developers companies develop apps in more popular languages, and people don't bother learning Lisp because there are no jobs for it.

Clojure avoids a lot of the pitfalls by running on the JVM and interfacing with Java. Java is rather dominant in the industry, a lot of companies already use it, and using alternative languages on the JVM is also becoming a fairly common practice. Strong Java integration also means that you have access to a great wealth of existing libraries. 

Having the ability to introduce Clojure in an existing project without having to change your environment is a huge plus. You can continue to use the same build tools, the same IDE, and same application servers for deployment. The only thing that changes is the actual language.

From the language design perspective I think it is also an improvement over the traditional Lisp syntax. For example let's compare `let` in CL to `let` in Clojure:
```clojure
    (let 
      ((a1 b1) 
       (a2 b2) 
       (an bn))
      (some-code a1 a2 an))

    (let [a1 b1
          a2 b2
          an bn]
      (some-code a1 a2 an))
```
To me Clojure version is easier to read because there's less noise, and I find the literal vector notation helps break up the code visually. Which brings me to the second thing I like, having literal vector, set, and map notation. I find it makes code more legible and helps see what's going on in a function.

The next thing I really like, that Clojure introduces, is destructuring. You can take any arbitrary data structure and read it backwards. Here are a few examples of what I'm talking about:
```clojure
    (def {:a [1 2 3] :b {:c 4} :d 5})

    (defn foo [{a :a b :b}]
      (println a b))

    (defn bar [{:keys [a b d]]
      (println a b d))

    (defn baz [{[a b c] :a {d :c} :b e :d}]
      (println a b c))
```
this also works in `let` statements, and again I find that it improves readability, especially in larger programs. While a minor nitpick I also like the naming conventions in Clojure standard library better. Names such as `car` and `cdr` are archaic in my opinion.