{:title "Easy PDF reports with clj-pdf",
 :layout :post,
 :tags ["clojure"]}

A few months ago I was tasked with generating reports for one of the applications I was working on. I looked around for some off the shelf libraries for doing this sort of thing. The most popular library in the Java world appears to be iText. It's a mature library with lots of features, but it takes entirely too much code to produce anything useful with it. On top of that, the latest version licensed under LGPL2 is 2.1.7 which, while serviceable, is full of quirks and odd behaviors.

After spending a bit of time playing with it I decided that it would make more sense to have a declarative API for describing the PDF document. I really like the way [Hiccup](http://weavejester.github.com/hiccup/) allows generating HTML using nested vectors, and decided that something similar could be done for generating PDF documents.

This lead to the creating of [clj-pdf](https://github.com/yogthos/clj-pdf), which allows describing the document using this approach. Each vector represents a different element, such as a paragraph, a list, or a table. Internally, I leverage iText to produce the actual PDF document, but the API is completely declarative. The library attempts to abstract away any of the quirks as well as provide useful elements such as headings, spacers, page breaks, etc.

Let's look at how this all works in practice. A document is simply a vector which contains metadata describing it followed by one or more inner elements:
```clojure
[{:title "My document"} "some content here..."]
```
In the spirit of Hiccup, each element is represented by a vector, where the first item must be a tag describing the type of the element, followed by optional metadata, and finally the content of the element. For example if we wanted to create a paragraph we'd do the following:
```clojure
[:paragraph "a fine paragraph"]
```
to set the font style we could add the following metadata:
```clojure
[:paragraph
  {:style :bold :size 10 :family :halvetica :color [0 255 221]}
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit."]
```
any metadata in an element will propagate to its children:
```clojure
[:paragraph
  {:style :bold :size 12 :family :halvetica :color [0 255 221]}
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
  [:phrase "some text here"]]
```
here the phrase will inherit the font style of its parent paragraph. However, the child element is always free to overwrite the parent metadata:
```clojure
[:paragraph
  {:style :bold :size 12}
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
  [:phrase {:style :normal :size 10} "some text here"]]
```
This provides us with a lot of flexibility, while allowing to specify defaults for the entire document. The library attempts to provide reasonable behavior out of the box, so that adding metadata should not be necessary in most cases. 

Some reports might include things like usage statistics. And to that end I leveraged the excellent [JFreeChart](http://www.jfree.org/jfreechart/) library to provide a simple charting API:
```clojure
[:chart {:type :line-chart 
         :title "Line Chart" 
         :x-label "checkpoints" 
         :y-label "units"} 
  ["Foo" [1 10] [2 13] [3 120] [4 455] [5 300] [6 600]]
  ["Bar" [1 13] [2 33] [3 320] [4 155] [5 200] [6 300]]]
```
At this time bar charts, line charts, time series, and pie charts are supported. And because a chart is just an image, all the image styling, such as scaling and alignment, can be applied to it as well.

Since the API is completely declarative, it doesn't actually have to be encoded in Clojure structures. We could instead encode it in something like JSON, which is exactly what I ended up doing next. I created a service which would accept POST requests containing JSON encoded documents and return PDF documents. The service can be accessed by any application regardless of what language its written in, and can even be called by JavaScript from a browser as can be seen [here](http://yogthos.net/instant-pdf/).

Documentation and examples are available on the [github project page](https://github.com/yogthos/clj-pdf).













