{:title "Introducing Selmer",
 :layout :post,
 :tags ["clojure" "luminus" "selmer"]}

# Introducing Selmer

## Rationale

There are a number of templating engines available in Clojure. Some of the popular ones include [Hiccup](https://github.com/weavejester/hiccup), [Enlive](https://github.com/cgrand/enlive), [Laser](https://github.com/Raynes/laser), [Stencil](https://github.com/davidsantiago/stencil), [mustache.clj](https://github.com/shenfeng/mustache.clj) and [Clabango](https://github.com/danlarkin/clabango).

As [I've mentioned previously](http://yogthos.net/blog/41-New+Templating+Engine+in+Luminus), my personal preference is for Clabango syntax. In my opinion it provides the right balance between simplicity and flexibility. Being modeled on Django template syntax it's also very accessible to those who are new to Clojure web development.

However, one major downside to Clabango is that it's slow. On TechEmpower [fortunes benchmark](http://www.techempower.com/benchmarks/#section=data-r6&hw=i7&test=fortune&f=4-0-1s) Luminus is crawling behind the Compojure results. Yes, you read that right, it's nearly 20 times slower for Clabango to render the results. The difference being that the Compojure benchmark is using Hiccup for rendering the results while Luminus is using Clabango.

The core problem is that Clabango always parses the source files when rendering a template. This is very expensive as it involves disk access and scanning each character in the source file each time a page is served. Dan states that [performance has not been a priority](https://github.com/danlarkin/clabango/issues/13).

On top of that, some of the existing behaviours put limitations on how much the performance can ultimately be improved. For example, the child templates aren't required to put their content inside blocks. Clabango parses the templates and creates the AST that's then evaluated. This means that you can put blocks inside the `if` tags and decide at runtime whether they will be included. If inheritance resolution is pushed to compile time this becomes a problem.

After having some discussions with [bitemyapp](https://github.com/bitemyapp) and [ceaserbp](https://github.com/cesarbp) we decided that it would be worth writing a fresh impelementation with pefromance as its primary goal. Another reason is that I would like to be able to ensure that the templating engine in Luminus isn't a compromise between speed and convenience. Owning the implementation is the best way to achieve that.

## Enter Selmer

All this resulted in [Selmer](https://github.com/yogthos/Selmer) named after [the guitar favored by Django Reinhardt](http://en.wikipedia.org/wiki/Selmer_guitar) whom in turn Django is named after. Selmer aims to be a near drop in replacement for Clabango. The current version is already quite fast keeping pace with Stencil which is one of the faster engines around.

In order to minimize the work that's done at runtime Selmer splits the process into three distinct steps. These steps include preprocessing, compilation and rendering. 

First, Selmer will resolve the inheritance hierarchy and generate the definitive template source to be compiled. The `extends` and `include` tags will be handled at this time.

The compilation step then produces a vector of text nodes and runtime transformer functions.

The renderer uses these compiled templates to generate its output. The text gets rendered without further manipulation while the transformers use the context map to generate their output at runtime.

Using this approach we minimize the amount of logic that needs to be executed during each request as well as avoiding any disk access in the process.

In order not to have to restart the application when the source templates are changed the renderer checks the last updated timestamp of the template. When the timestamp is changed a recompile is triggered.

## Performance Tricks

To our chagrin the first run of the parser ran no better than Clabango. This was rather disappointing considering we took pains to be mindful of the performance issues. However, this mystery was quickly solved by profiling the parser.

Sure enough majority of time was spent in reflection calls. One major problem was that the renderer had to check whether each node was text or a function:

```clojure
(defn render [template params]  
  (let [buf (StringBuilder.)]
    (doseq [element template] 
      (.append buf (if (string? element) element (element params))))
    (.toString buf)))
```

Protocols offer an elegant solution to this problem. With their help we can move this work to compile time as follows:

```clojure
(defprotocol INode
  (render-node [this context-map] "Renders the context"))

(deftype FunctionNode [handler]
  INode
  (render-node ^String [this context-map]
    (handler context-map)))

(deftype TextNode [text]
  INode
  (render-node ^String [this context-map]
    text))
```

Now our parser can happily run along and call `render-node` on each element:

```clojure
(defn render-template [template context-map]
  """ vector of ^selmer.node.INodes and a context map."""
  (let [buf (StringBuilder.)]
    (doseq [^selmer.node.INode element template]
        (if-let [value (.render-node element context-map)]
          (.append buf value)))
    (.toString buf)))

```

With this change and a few type annotations the performance improved dramatically. Running [clojure-template-benchmarks](https://github.com/bitemyapp/clojure-template-benchmarks) the results are comparable to Stencil. Here are the results from benchmarking on my machine:

### Clabango

* Simple Data Injection    
  * Execution time mean : 657.530826 µs
  * Execution time std-deviation : 2.118301 µs
* Small List (50 items)    
  * Execution time mean : 2.446739 ms
  * Execution time std-deviation : 17.448003 µs
* Big List (1000 items)    
  * Execution time mean : 28.230365 ms
  * Execution time std-deviation : 173.518425 µs

### Selmer 

* Simple Data Injection
  * Execution time mean : 42.444958 µs
  * Execution time std-deviation : 235.652171 ns

* Small List (50 items)    
  * Execution time mean : 209.158509 µs
  * Execution time std-deviation : 4.045131 µs

* Big List (1000 items)    
  * Execution time mean : 3.223797 ms
  * Execution time std-deviation : 55.511322 µs
    
### Stencil    

* Simple Data Injection    
   * Execution time mean : 92.317566 µs
   * Execution time std-deviation : 213.253353 ns

* Small List (50 items)    
  * Execution time mean : 290.403204 µs
  * Execution time std-deviation : 1.801479 µs

* Big List (1000 items)   
  * Execution time mean : 1.223634 ms
  * Execution time std-deviation : 4.264979 µs
    
As you can see Selmer is showing a large improvement over Clabango and has no trouble keeping up with Stencil.

Obviously, this benchmark is fairly simplistic so you can take it with a grain of salt. If anybody would like to put together a more comprehensive suite that would be great. :)

## Current status

The library implements all the functionality offered by Clabango and passes the Clabango test sutie. There are a few minor deviations, but overall it should work as a drop in replacement without the need to change your existing HTML templates. 

We also have a few new features such as the Django `{{block.super}}` tag support and ability to use filters in if statements. In Selmer you can write things like:

```clojure
(selmer.filters/add-filter! :empty? empty?)

(render 
  "{% if files|empty? %}
   no files available 
   {% else %} 
       {% for file in files %}{{file}}{% endfor %} 
   {% endif %}"
  {:files []})
```

Switching to Selmer involves swapping the `[clabango "0.5"]` dependency for `[selmer "0.5.3"]` and referencing `selmer.parser` instead of `clabango.parser`. Selmer provides the same API for rendering templates using the `selmer.parser/render` and `selmer.parser/render-file` functions.

One major area of difference is in how custom tags and filters are defined. Defining a filter is done by calling `selmer.filters/add-filter!` with the id of the filter and the filter function:

```clojure
(use 'selmer.filters)

(add-filter! :embiginate #(.toUpperCase %))

(render "{{shout|embiginate}}" {:shout "hello"})
=>"HELLO"
```

Defining custom tags is equally simple using the `selmer.parser/add-tag!` macro:

```clojure
(use 'selmer.parser)

(add-tag! :foo
  (fn [args context-map]
    (str "foo " (first args))))

(render "{% foo quux %} {% foo baz %}" {})
=>"foo quux foo baz"
```

tags can also contain content and intermediate tags:

```clojure
(add-tag! :foo
  (fn [args context-map content]
    (str content))
  :bar :endfoo)

(render "{% foo %} some text {% bar %} some more text {% endfoo %}" {})
=>"{:foo {:args nil, :content \" some text \"}, :bar {:args nil, :content \" some more text \"}}"
```

Selmer also supports overriding the default tag characters using `:tag-open`, `:tag-close`, `:filter-open`, `:filter-close` and `:tag-second` keys:

```clojure
(render "[% for ele in foo %]<<[{ele}]>>[%endfor%]"
                 {:foo [1 2 3]}
                 {:tag-open \[
                  :tag-close \]})
```

This makes it much easier to use it in conjunction with client-side frameworks such as AngularJs.

One limitation Selmer has is the way it handles inheritance. Since the inheritance block hierarchy is compiled before the parsing step, any content in child templates must be encapsulated in block tags. Free-floating tags and text will simply be ignored by the parser. This is in line with [Django behavior](http://stackoverflow.com/questions/1408925/django-templates-include-and-extends).

So there you have it. If you like Django template syntax or just want a fast templating engine then give Selmer a try.

As it is a new project there may be bugs and oddities so don't hesitate to open an issue on the project page if you find any. So far I haven't found any problems in switching my application from Clabango to Selmer and the test coverage is fairly extensive at this point. 