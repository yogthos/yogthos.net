
{:title "Working around the Java SSL trust store", :layout :post, :tags ["clojure"]}

The Java standard library can do a lot of useful things. For example, the `java.net.URL` class provides a simple way to read code from either the filesystem or the network. We can even do fun stuff like this using it:

```clojure
(-> "https://gist.githubusercontent.com/yogthos/f432e5ba0bb9d70dc479/raw/768050c7fae45767b277a2ce834f4d4f00158887/names.clj"
    (java.net.URL.)
    (slurp)
    (load-string))

(gen-name 11 6)    
```

Unfortunately, Java SSL certs don't appear to be up to date. For example, the [https://http.cat/](https://http.cat/) site has a valid certificate that's not part of the default Java trust store. Let's write a function to read an image from the site using `java.net.URL`, then save it to a file:

```clojure
(defn read-image [url]
  (let [conn (.openConnection (java.net.URL. url))]    
    (.getInputStream conn)))
    
(clojure.java.io/copy
  (read-image "https://http.cat/200")
  (java.io.FileOutputStream. "200.jpg"))
```
This time we end up with a security exception because the default trust store does not contain the right certificate.

```
javax.net.ssl.SSLHandshakeException: sun.security.validator.ValidatorException:
PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException:
unable to find valid certification path to requested target
...
```

One way to work around this problem is to add the certificate to the local store. However, this has to be done manually on each machine that the code will run on.

Instead, let's take a look at how we can disable the certificate check for a specific connection. We'll first have to create a proxy `TrustManager`, then use it to create a socket factory for our connection as seen in the following code:

```clojure
(defn set-socket-factory [conn]
  (let [cert-manager (make-array X509TrustManager 1)
        sc           (SSLContext/getInstance "SSL")]
    (aset cert-manager 0
          (proxy [X509TrustManager][]
            (getAcceptedIssuers [])
            (checkClientTrusted [_ _])
            (checkServerTrusted [_ _])))
    (.init sc nil cert-manager (java.security.SecureRandom.))
    (.setSSLSocketFactory conn (.getSocketFactory sc))))
```

We can now update the `read-image` function to set the custom socket factory for the connection before trying to read from it:

```clojure
(defn read-image [url]
  (let [conn (.openConnection (java.net.URL. url))]
    (set-socket-factory conn)
    (.getInputStream conn)))

(clojure.java.io/copy
  (read-image "https://http.cat/200")
  (java.io.FileOutputStream. "200.jpg"))    
```

We should now have a `200.jpg` file on our file system with the following content:

![cat](https://http.cat/200)

That's all there is to it. We can now enjoy consuming cat HTTP status pictures using the `java.net.URL` and even make some [Ring middleware](https://github.com/yogthos/ring-http-cat-status) using it. :)



