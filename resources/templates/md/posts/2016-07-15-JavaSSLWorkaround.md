
{:title "Working around the Java SSL trust store"
 :layout :post
 :tags ["clojure"]}

The Java standard library provides a rich networking API. For example, the `java.net.URL` class provides a simple way to access resources using a URL location pattern. We can do fun stuff like this using it:

```clojure
(-> "https://gist.githubusercontent.com/yogthos/f432e5ba0bb9d70dc479/raw/768050c7fae45767b277a2ce834f4d4f00158887/names.clj"
    (java.net.URL.)
    (slurp)
    (load-string))

(gen-name 11 6)    
```

Unfortunately, the SSL certificates bundled with the default Java runtime aren't comprehensive. For example, the [https://http.cat/](https://http.cat/) site has a valid certificate that's not part of the default Java trust store.

Let's write a function to read an image from the site using `java.net.URL`, then save it to a file to see what happens.

```clojure
(defn read-image [url]
  (let [conn (.openConnection (java.net.URL. url))]    
    (.getInputStream conn)))
    
(clojure.java.io/copy
  (read-image "https://http.cat/200")
  (java.io.FileOutputStream. "200.jpg"))
```
When we try to access the resource, we end up with a security exception because the default trust store does not contain the right certificate.

```
javax.net.ssl.SSLHandshakeException: sun.security.validator.ValidatorException:
PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException:
unable to find valid certification path to requested target
...
```

One way we could work around this problem would be to add the certificate to the local store. This is the proper solution that should be used in the vast majority of cases.

However, there are situations where this approach isn't possible. I've run into many situations working in the enterprise where SSL was misconfigured, and the application would need to connect to an intranet service over such a connection. At the same time I had no control over the deployment environment and wasn't able to manage the keystore there.

An alternative approach is to replace the default certificate check for a specific connection with a custom one. Let's see take a look at how this can be accomplished.

We'll first have to create a proxy `TrustManager`, then use it to create a socket factory for our connection as seen in the following code:

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

The custom socket factory will use the `X509TrustManager` proxy that we provide and rely on it for validation. We can simply return `nil` from each of the validation methods to skip the certificate validation.

Note that while we're skipping validation entirely in the above example, we'd likely want to supply a custom validator that validates against an actual certificate in practice.

Next, let's update the `read-image` function to set the custom socket factory for the connection before trying to read from it:

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

That's all there is to it. We can now enjoy consuming cat HTTP status pictures using the `java.net.URL` and even make some silly [Ring middleware](https://github.com/yogthos/ring-http-cat-status) using it. :)



