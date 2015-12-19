{:title "Noir tutorial - part 4",
 :layout :post,
 :tags ["noir" "clojure"]}

### Securing Pages

This part of the tutorial will focus on controlling page visibility, form validation, and handling complex form parameters. In the [last section](http://yogthos.net/blog/25-Noir+tutorial+-+part+3) we added support for uploading files, it would make sense to make the `upload` page private. This way only registered users can access it.

Noir provides a [`pre-route`](http://webnoir.org/autodoc/1.2.1/noir.core-api.html#noir.core/pre-route) macro for handling this. However, we will not be using it for a couple of reasons. 

First, there is currently a bug in Noir, where `pre-route` ignores the servlet context, meaning that unless our application is deployed to "/" the routing will not work as expected. The second reason is that you have to remember to add a `pre-route` entry for each page that you want to make private. 

A better solution, in my opinion, is to simply write a macro which will behave the same way as defpage, but will check if there is a user in session and redirect to "/" otherwise. With this approach we make pages private right in their definition. Let's open up our `common` namespace and add the macro:
```clojure
(defmacro private-page [path params & content]
  `(noir.core/defpage 
     ~path 
     ~params 
     (if (session/get :user) 
      (do ~@content) 
      (resp/redirect "/"))))
```

As you can see it has exactly same signature as `defpage` and calls it  internally as you normally would, but only adds the content if the session contains a user, otherwise the page will redirect to "/".

Now, we'll go to our `files` namespace and mark all the pages as private:
```clojure
(common/private-page "/upload" {:keys [info]}
  ...)

(common/private-page [:post "/upload"] {:keys [file]}
  ...)

(common/private-page "/files/:name" {:keys [name]} 
  ...)
```
Let's test that it works by navigating to [localhost:8080/upload](http://localhost:8080/upload) without logging in. We should be redirected right back to "/".

### Site navigation

Since we now have a couple of pages that we will be navigating we can add a navigation menu in our `common` namespace:
```clojure
(defn menu []
  [:div.menu
   [:ul
    [:li (form-to [:post "/logout"] (submit-button "logout"))]    
    [:li (link-to "/upload" "my files")]
    [:li (link-to "/" "home")]]])

(defpartial layout [& content]
  (html5
    [:head
     [:title "my-website"]
     (include-css "/css/reset.css")]
    [:body               
     (if-let [user (session/get :user)]
       [:div
        (menu)
        [:h2 "welcome " user]]
       [:div.login
        (login-form) [:p "or"] (link-to "/signup" "sign up")])     
     content]))
```
Now, if a user logs in, they will see the navigation menu and can either select home or their files page. To keep things clean we'll also move the `logout` link into our menu. This is functional, but it's rather ugly, so let's add some CSS to make it a bit nicer. We'll open up our stock `resources/public/css/reset.css` which was generated for our site and add the following to it:
```
.menu ul {
    list-style: none;
    margin: 0;
    padding-left: 0;
}
.menu li {
    float: right;
    position: relative;
    margin-right: 20px;
}
```
Things should look much better now:
<center>
![menu](/files/menu.png)
</center>

### Input Validation

Next, let's reexamine our sign up page, previously we didn't bother doing any validation when creating a new user, so let's add some now. Noir provides a simple way to validate input fields via the [`noir.validation`](http://www.webnoir.org/autodoc/1.2.1/noir.validation-api.html) namespace. Let's open the `users` namespace and add it in:
```clojure
(ns my-website.views.users
  (:use [noir.core]
        hiccup.core hiccup.form)
  (:require [my-website.views.common :as common]
            [my-website.models.db :as db]
            [noir.util.crypt :as crypt]
            [noir.session :as session]
            [noir.response :as resp]
            [noir.validation :as vali]))
```
Next we will create our validation function:
```clojure
(defn valid? [{:keys [handle pass pass1]}]
  (vali/rule (vali/has-value? handle)
             [:handle "user ID is required"])
  (vali/rule (vali/min-length? pass 5)
             [:pass "password must be at least 5 characters"])  
  (vali/rule (= pass pass1)
             [:pass "entered passwords do not match"])
  (not (vali/errors? :handle :pass :pass1)))
```
The function will check that all the fields conform to the rules, such as user id being provided, minimum password length, and that retyped password matches the original. The rules have the following form:
```clojure
(rule validator [:filed-name "error message"])
```
where the validator must return a boolean. We'll also need a helper for displaying the error on the page:
```clojure
(defpartial error-item [[first-error]]
  [:p.error first-error])
```
Next we will update our `signup` page to show the errors generated by the validator:
```clojure
(defpage "/signup" {:keys [handle error]}
  (common/layout
    [:div.error error]
    (form-to [:post "/signup"]
             (vali/on-error :handle error-item)
             (label "user-id" "user id")
             (text-field "handle" handle)
             [:br]
             (vali/on-error :pass error-item)
             (label "pass" "password")
             (password-field "pass")             
             [:br]
             (vali/on-error :pass1 error-item)
             (label "pass1" "retype password")
             (password-field "pass1")             
             [:br]
             (submit-button "create account"))))
```
All we have to do here is add `on-error` statements for each field we're validating. Finally, we'll have to update the `POST` part of the page, to call the validator and return the errors:
```clojure
(defpage [:post "/signup"] user
  (if (valid? user)
    (try 
      (db/add-user (update-in (dissoc user :pass1) [:pass] crypt/encrypt))
      (resp/redirect "/")
      (catch Exception ex
        (render "/signup" (assoc user :error (.getMessage ex)))))
    (render "/signup" user)))
```
This should give you a basic idea of how to validate input using Noir, and more details about validation can be found on the [official site](http://www.webnoir.org/tutorials/forms).

One thing you'll notice that when we navigate to the `signup` page, we still see the login option as well as the link to sign up:
<center>
![sign up](/files/signup1.png)
</center>
This is because our layout adds these to every page. We can fix this by splitting `layout` in the `common` namespace as follows:
```clojure
(defpartial basic-layout [& content]
  (html5
    [:head
     [:title "my-website"]
     (include-css "/css/reset.css")]
    [:body content]))

(defpartial layout [& content]  
  (basic-layout 
    [:div
     (if-let [user (session/get :user)]      
       [:div
        (menu)
        [:h2 "welcome " user]]
       [:div
        [:div.login
         (login-form) 
         [:p "or"] 
         (link-to "/signup" "sign up")]])
     content]))
```
Then we simply change:
```clojure
(defpage "/signup" {:keys [handle error]}
  (common/layout
  ...)

(defpage "/signup" {:keys [handle error]}
  (common/basic-layout
  ...)
```
Another clean up item is to make our form items aligned, to do that we can use the following bit of CSS:
```
label {
    margin-left: 10px;
    width:120px; 
    float:left;
}
```
The sign up page should now look as follows:
<center>
![sign up](/files/signup2.png)
</center>

### Complex Form Items

Now that we've cleaned up our `singup` page, we'll turn our attention back to file management. We'll add the ability for the user to filter files by their type. To do that we will first create a function in our `db` namespace to get all the file types from our database:
```clojure
(defn file-types []
  (map :type (db-read "select distinct type from file")))
```
Then in our `files` namespace we will create a new helper called `select-files-by-type`:
```clojure
(defn select-files-by-type []  
  (let [file-types (db/file-types)] 
    (form-to [:post "/show-files"]
             "select file types to show"
             (into 
               (with-group "file-types")
               (for [type file-types]
                 [:div 
                  type
                 (check-box type)]))
             (submit-button "show files"))))
```
which we will add to our "/upload" page:
```clojure
(common/private-page "/upload" {:keys [info]}
  (common/layout       
    [:h2.info info]
    (select-files-by-type)
    (list-files)
    (form-to {:enctype "multipart/form-data"}
             [:post "/upload"]
             (label :file "File to upload")
             (file-upload :file)
             [:br]
             (submit-button "upload"))))
```
This function will read the file types from the database and create a checkbox group from them. When we hit submit we'll see something like the following in our params:
```clojure
{"image/png" "true", "image/jpeg" "true"}
```
Where the value of each selected checkbox will appear as a key in the params map with the value of "true". We will now have to update our `list-files` function to accept optional file type restriction and in turn pass it to `list-files` in `db` namespace:
```clojure
(defn list-files [& [types]]  
  (into [:ul]
        (for [name (db/list-files types)]             
          [:li.file-link (link-to (str "/files/" name) name) 
           [:span "  "] 
           [:div.file]])))
```
The following changes will have to be made to retrieve files based on type:
```clojure
(defn params-query [params]
  (apply str (interpose ", " (repeat (count params) "?"))))

(defn list-files [& [types]]
  (map :name 
       (if types
         (apply (partial db-read (str "select name from file where type in (" (params-query types) ")")) types)
         (db-read "select name from file"))))
```
The `params-query` helper will create an appropriate WHERE clause based on the number of types we pass in, and `list-files` will now check if types have been passed in and create the appropriate query.  Finally, we'll add a new page which will display the selected files:
```clojure
(common/private-page [:post "/show-files"] params
  (let [file-types (keys params)] 
    (common/layout 
      [:h2 "showing files types " 
       (apply str (interpose ", " file-types))]
      (list-files file-types)
      (link-to "/upload" "back"))))
```
The "/upload" page should now look as follows:
<center>
![file upload](/files/file-upload1.png)
</center>
When we select some files and hit "show files" button we should see our new "show-files" page:
<center>
![file upload](/files/show-files.png)
</center>

### Summary

In this section we covered the following topics:
* restricting access to pages
* creating a navigation menu
* input validation
* handling inputs from multi part items such as check boxes

The complete code for this section is available [here](https://github.com/yogthos/Noir-tutorial/tree/ee1bd8aaa90b8144015201bf8fc5a99f7d007e57).


