{:title "Serving RSS with Clojure", :layout :post, :tags ["clojure"]}

I recently got invited to join [Planet Clojure](http://planet.clojure.in/), which is an excellent place for keeping up with what people are up to in Clojure world. As part of being syndicated I had to add an [RSS](http://en.wikipedia.org/wiki/RSS) feed to my blog. A cursory Google search came up with lots of tutorials for parsing RSS, but nothing regarding generating it. Turns out that it's very straight forward and it takes less than a 50 lines of code to create a proper RSS feed for your site.

First, a bit of background about RSS. Essentially, it's a very simple syndication format designed to allow pushing out notifications about frequently updated content such as blog posts. RSS is served as XML and each feed has to consist of a channel tag with some metadata and item tags, each one describing a specific update such as a new blog post.

All we have to do to create our RSS feed is to structure the data accordingly and serialize it to XML. Clojure standard library provides a simple way to output XML using the `emit` function in the `clojure.xml` namespace. It accepts data in the following format:
```clojure
{:tag :tag-name :attrs attrs-map :content [content]}
```
The content in the above can contain a mix of strings and tags. One thing to be aware of is that any other content will result in a null pointer exception, so it's one of rare cases where that doesn't get handled gracefully by default. Once we've constructed a proper tag we can serialize it to XML as follows:
```clojure
(with-out-str 
  (clojure.xml/emit 
    {:tag :channel :attrs nil :content []}))
```
which results in
```xml
<?xml version='1.0' encoding='UTF-8'?>
<channel>
</channel>
```
Note that `emit` needs to be wrapped in `with-out-str` to capture its output into a string. RSS also specifies the format in which time should be output, so we'll make a helper function to handle that:
```clojure
(defn format-time [time] 
  (.format (new java.text.SimpleDateFormat 
                "EEE, dd MMM yyyy HH:mm:ss ZZZZ") time))
```
Writing out the tags by hand gets tedious, so I wrote a macro to output the tags for us: 
```clojure
(defmacro tag [id attrs & content]
  `{:tag ~id :attrs ~attrs :content [~@content]})
```
I covered macros briefly in an [earlier post](http://yogthos.net/blog/14). The only new syntax used here is the `~@` notation, which simply says that the items in content should be inserted into the enclosing structure, eg:
```clojure
(tag :foo nil "foo" "bar" "baz")
{:tag :foo, :attrs nil, :content ["foo" "bar" "baz"]}
```
Armed with this macro let's write the function to describe an individual post. The function accepts the site, the author and a map describing the post as parameters, then generates the appropriate tags as per RSS specification.
```clojure
(defn item [site author {:keys [id title content time]}]
  (let [link (str site "/" id )] 
    (tag :item nil
         (tag :guid nil link)
         (tag :title nil title)
         (tag :dc:creator nil author)
         (tag :description nil content)
         (tag :link nil link)
         (tag :pubDate nil (format-time time))
         (tag :category nil "clojure"))))
```
Let's test that it does what we expect:
```clojure
(item "http://yogthos.net"
      "Yogthos" 
      {:id 1 
       :title "Test post" 
       :content "Some content" 
       :time (new Date)})

{:content
 [{:content ["http://yogthos.net/1"], :attrs nil, :tag :guid}
  {:content ["Test post"], :attrs nil, :tag :title}
  {:content ["Yogthos"], :attrs nil, :tag :dc:creator}
  {:content ["Some content"], :attrs nil, :tag :description}
  {:content ["http://yogthos.net/1"], :attrs nil, :tag :link}
  {:content ["Sat, 04 Aug 2012 18:16:03 -0400"],
   :attrs nil,
   :tag :pubDate}
  {:content ["clojure"], :attrs nil, :tag :category}],
 :attrs nil,
 :tag :item}
```
If we pass the above to `xml/emit` we'll get the corresponding XML. Next we'll need a function which will will create the representation of the channel:
```clojure
(defn message [site title author posts]
  (let [date (format-time (new Date))] 
    (tag :rss {:version "2.0"
               :xmlns:dc "http://purl.org/dc/elements/1.1/"
               :xmlns:sy "http://purl.org/rss/1.0/modules/syndication/"}
         (update-in 
           (tag :channel nil
                (tag :title nil (:title (first posts)))
                (tag :description nil title)
                (tag :link nil site)
                (tag :lastBuildDate nil date)
                (tag :dc:creator nil author)
                (tag :language nil "en-US")
                (tag :sy:updatePeriod nil "hourly")
                (tag :sy:updateFrequency nil "1"))
           [:content]
           into (map (partial item site author) posts)))))
```
Again, this is fairly straight forward, the function takes the site url, blog title, the author and the posts. Then it creates the necessary tags to describe the channel and inserts the formatted posts into it. We should now be able to generate valid RSS content by calling it with some data:
```clojure
(message "http://yogthos.net" "My blog" "Yogthos" 
         [{:id 1 
           :title "Test post" 
           :content "Some content" 
           :time (new Date)}])

{:content
 [{:content
   [{:content ["Test post"], :attrs nil, :tag :title}
    {:content ["My blog"], :attrs nil, :tag :description}
    {:content ["http://yogthos.net"], :attrs nil, :tag :link}
    {:content ["Sat, 04 Aug 2012 18:23:06 -0400"],
     :attrs nil,
     :tag :lastBuildDate}
    {:content ["Yogthos"], :attrs nil, :tag :dc:creator}
    {:content ["en-US"], :attrs nil, :tag :language}
    {:content ["hourly"], :attrs nil, :tag :sy:updatePeriod}
    {:content ["1"], :attrs nil, :tag :sy:updateFrequency}
    {:content
     [{:content ["http://yogthos.net/blog/1"], :attrs nil, :tag :guid}
      {:content ["Test post"], :attrs nil, :tag :title}
      {:content ["Yogthos"], :attrs nil, :tag :dc:creator}
      {:content ["Some content"], :attrs nil, :tag :description}
      {:content ["http://yogthos.net/blog/1"], :attrs nil, :tag :link}
      {:content ["Sat, 04 Aug 2012 18:23:06 -0400"],
       :attrs nil,
       :tag :pubDate}
      {:content ["clojure"], :attrs nil, :tag :category}],
     :attrs nil,
     :tag :item}],
   :attrs nil,
   :tag :channel}],
 :attrs
 {:version "2.0",
  :xmlns:dc "http://purl.org/dc/elements/1.1/",
  :xmlns:sy "http://purl.org/rss/1.0/modules/syndication/"},
 :tag :rss}
```
Finally, we'll write a function which converts the message to XML:
```clojure
(defn rss-feed [site title author posts]
  (with-out-str (emit (message site title author posts))))
```
We can confirm that we're generating valid content by pasting it to [W3C Feed Validation Service](http://validator.w3.org/feed/#validate_by_input). This is all that's needed to create a valid RSS message. It can now be served over HTTP using your favorite library or framework. 

Complete code for the example can be found [here](https://gist.github.com/3260456).

## Updates

I've since rolled all of the above into a (hopefully :) friendly [clj-rss](https://github.com/yogthos/clj-rss) library.
