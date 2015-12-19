{:title "Parsing and rendering templates in Clojure & Haskell",
 :layout :post,
 :tags []}

A little while back [Chris Allen](https://github.com/bitemyapp) discovered the joys of Haskell. We had a few discussions regarding the merits of static typing and whether Haskell would be a more productive language than Clojure.

Haskell was my first foray into functional programming, and it's the language that made me fall in love with it. However, I also found that non-trivial type relationships would often require a lot of mental gymnastics. Eventually, I ended up moving to Clojure as I realized that I was simply more productive in it.

Chris would have none of this, and repeatedly told me that I was simply lying about having tried Haskell, since nobody could possibly enjoy using a dynamic language after seeing the glory of HM type inference.

These sorts of debates are rather tiring, so instead I proposed that Chris would translate a small piece of Clojure code to Haskell. Then we could discuss the merits of each approach using a concrete example.

On December of 2013, I posted [this gist](https://gist.github.com/yogthos/8025281) and while it's not trivial, it weighs in at about 70 lines of code. It's a minimal example where I find Haskell starts making things unnecessarily difficult.

The code runs through a stream and looks for either `{{...}}` or `{% if ... %}` tags. It is intentionally kept short to limit noise, so it simply reads the tag names and prints them out. Since the code is a dumbed down version of [Selmer](https://github.com/yogthos/Selmer), which Chris participated on writing, I assumed he would have little difficulty reading and translating it.

To my surprise he started making excuses that if he did translate it then it would give me ammunition to complain about Haskell being difficult. I think that's a rather strange argument to make for somebody making the case that Haskell makes things simpler.

Then he said he'd do it using the [Parsec](http://www.haskell.org/haskellwiki/Parsec) library, which obviously defeats the point. The question is not whether you can figure out a library API in Haskell, but how would you translate specific piece of Clojure code to Haskell.

The power of Clojure is that it allows me to solve hard problems instead of having to rely on somebody else to write libraries that do the hard stuff and then glue them together.

At this point Chris proceeded to ignore the request for over half a year, until he suddenly decided to start [messaging me about it on Twitter](https://twitter.com/bitemyapp/status/517829996975370240) last night. All of a sudden he couldn't wait a second more and what's more apparently my code was broken! As he so eloquently put it ["@yogthos broken software in a unityped language...whodathunkit..."](https://twitter.com/bitemyapp/status/517830192509624320). He proceeded to berate me and insisted that the code does not work, that [I'm a liar](https://twitter.com/bitemyapp/status/517833301801721856) for suggesting that it does, and he must make a blog post regarding this situation immediately.

I was surprised to hear this as I clearly recall the parser example working last I touched it. Since there was no reason to change it, I was fairly confident that it would be in working order. However, not having access to a computer at the time I could not check it myself.

Normally, if an individual contacts me respectfully I would be glad to help and work with them to figure out what the problem is. I make mistakes, we all do, and it's conceivable that there might've been a problem with my code. The approach Chris chosen was frankly insulting.

I explained to Chris that I was not at a computer and I can't look at the code, but evidently the blog post simply could not wait. You can read it in full [here](http://bitemyapp.com/posts/2014-10-02-parsing-and-rendering-templates-in-haskell.html).

The problem turned out to be that Chris is apparently incapable of reading code. The parser gets initialized with the `render-file` function:

```clojure
(defn render-file [filename args]
  (render (parse filename) args))
```

This function calls the `parse` function on the `filename` and then passes the parsed content to `render`. Chris tried to call `render` with:

```clojure
(parser/render "Hello {{name}}!" {:name "Yogthos"})
```

Shockingly enough he got an error doing that, at this point he evidently was incapable figuring out on his own what was causing the error and proceeded to throw a tantrum on Twitter.

Of course, if the goal was to actually figure out what the problem was then one would at least look at what parse is doing:

```clojure
(defn parse [file]
  (with-open [rdr (clojure.java.io/reader file)]
```

Then it would immediately become obvious that we must pass in something that can be read by `clojure.java.io/reader`, such as `java.io.StringBufferInputStream`, and then pass the result of `parse` to `render`. Naturally, when called correctly the code does exactly what it's supposed to:

```clojure
(render
  (parse
    (java.io.StringBufferInputStream. "Hello {{name}}"))
    {:name "Yogthos"})
=>"Hello filter tag value: name"
```

Since Chris managed to run the `render-file` function as seen in one the snippets in his blog post, he doesn't seem to understand that I asked him to translate that code to Haskell. For whatever reason, he includes a screenshot of Selmer documentation, which is *not* the behavior of the parser and was never intended to be. The spec that Chris was asked to translate to Haskell is the code in the gist.

In his post, Chris went ahead and answered the question he would like to have been asked as opposed to the one he was actually asked. I suppose making a straw man is a lot easier than answering the original question.

What I learned from this experience is that some Haskell users like to talk a lot about their favorite language, but when asked to solve a simple problem they will do anything but that. I don't find that to be terribly convincing myself.
