{:title "Moving to Cryogen",
 :layout :post,
 :tags ["cryogen" "clojure"]}

The blog has officially been moved over to [Cryogen](https://github.com/lacarmen/cryogen). While, all the content has been migrated over, the links for the posts have changed and the original comments are no longer available since I'm now using Disqus.

[Yuggoth](https://github.com/yogthos/yuggoth) was a fun experment and it held up to most traffic storms over the years, but at the end of the day it's hard to beat the simplicity of a static site.

Porting the content from my old blog turned out to be a simple affair. I used Postgres to store all the blog content in Yuggoth. The database contains tables for the posts, the comments, the tags, and the files. All I had to do was extract the data and write it back out using the Cryogen format. First, I extracted the binary data for the files as seen below.

```clojure
(defn write-file [{:keys [data name]}]
   (with-open [w (clojure.java.io/output-stream
                   (str "resources/templates/files/" name))]
     (.write w data)))

(defn extract-files []
  (doseq [file (sql/query db ["select * from file"])]
    (write-file file)))

```

The posts table contains the content, while the tags are stored in a separate table. The tags can be aggregated by post using the handy `array_agg` function. This function will produce a `Jdbc4Array` as the result, and its contents can then be extracted to a vector.

```clojure
(defn extract-tags [post]
  (update-in post [:tags] #(vec (.getArray %))))

(defn get-posts []
  (map extract-tags
       (sql/query db
         ["select array_agg(t.tag) as tags,
                  b.id, b.time, b.title, b.content from blog b, tag_map t
           where t.blogid = b.id
           group by b.id, b.time, b.title, b.content"])))

```

Now, all that's left to do is to generate the post metadata and the file name. Since each
post contains a publication date and a title, these can be used to produce a filename in the format
expected by Cryogen.


```clojure
(defn format-post-date [date]
  (let [fmt (java.text.SimpleDateFormat. "dd-MM-yyyy")]
    (.format fmt date)))

(defn format-post-filename [time title]
  (str
    (->> (re-seq #"[a-zA-Z0-9]+" title)
         (clojure.string/join "-")
         (str "resources/templates/md/posts/" (format-post-date time) "-"))
   ".md"))
```

With that in place we can simply run through all the posts and extract them into appropriate files.

```clojure
(defn write-post [{:keys [id time tags content title]}]
  (with-open [wrt (clojure.java.io/writer (format-post-filename time title))]
    (.write wrt
            (with-out-str
              (clojure.pprint/pprint
                {:title title
                 :layout :post
                 :tags (vec (.split tags " "))})))
    (.write wrt "\n")
    (.write wrt content)))

(defn extract-posts []
  (doseq [post (get-posts)]
    (write-post post)))

```

And that's all there is to it. Moral of the story is that we should always keep the data separate
from its representation as you never know when you will need it down the road.
