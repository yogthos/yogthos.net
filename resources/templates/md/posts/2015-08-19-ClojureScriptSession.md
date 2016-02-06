{:title "ClojureScript Session Timeout"
 :layout :post
 :draft? true
 :tags ["clojure"]}
 
```clojure
(def timeout-ms (* 1000 60 30))

(defn session-timer []
  (when (session/get :identity)
    (if (session/get :user-event)
      (do
        (session/remove! :user-event)
        (js/setTimeout #(session-timer) timeout-ms))
      (session/remove! :identity))))

(defn init-session-timer! []
  (letfn [(user-action [] (session/put! :user-event true))]
    (.addEventListener js/document "keypress" user-action false)
    (.addEventListener js/document "click" user-action false)
    (js/setTimeout session-timer timeout-ms)))
```