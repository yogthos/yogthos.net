{:title "Introducing reagent-forms",
 :layout :post,
 :tags ["reagent" "clojurescript"]}

One thing I’ve always found to be particularly tedious is having to create data bindings for form elements. Reagent makes this much more palatable than most libraries I’ve used. All you need to do is create an atom and use it to track the state of the components.

However, creating the components and binding them to the state atom is still a manual affair. I decided to see if I could roll this into a library that would provide a simple abstraction for tracking the state of the fields in forms.

The usual way to bind inputs to atoms as illustrated in the [official Reagent docs](http://holmsand.github.io/reagent/) can be seen below:

```clojure
(ns example
  (:require [reagent.core :as reagent :refer [atom]]))

(defn atom-input [value]
  [:input {:type "text"
           :value @value
           :on-change #(reset! value (-> % .-target .-value))}])

(defn shared-state []
  (let [val (atom "foo")]
    (fn []
      [:div
       [:p "The value is now: " @val]
       [:p "Change it here: " [atom-input val]]])))
```
We create an atom with some state and then pass it to our input component. The component will display the current value and update the state when its `:on-change` event is triggered.

Normally, we’d have to go through each field in the form and pass the state to it so that it can bind itself to the document we’re generating.

I wanted to be able to specify a template for a form and then pass the entire template to a function that would take care of binding all the fields to an atom representing the document.

This function would need to know what parts of the form need to be bound, how to bind each type of element, and how to uniquely identify it in the document.

My solution was to introduce the `:field` attribute that would identify the component as a form field, and to use the `:id` attribute as the unique key for the element.

The binding function would then walk the form and check for any component that contain the `:field` key in its attribute map. The key would point to the type of component such as text, numeric, list, and so on.

Then it could pass the component to a specific binding function that would be responsible for linking the field with the document and return a bound component. Let’s take a look at how this all works with an example.  

We’ll first need to include the library in our project `[reagent-forms "0.1.3"]
`, then we’ll require the `reagent-forms.core/bind-fields` function in our namespace:

```clojure
(ns myform.core
  (:require [reagent-forms.core :refer [bind-fields]])
```
Next, we need to create a form template to represent our form:

```clojure
(defn row [label input]
  [:div.row
    [:div.col-md-2 [:label label]]
    [:div.col-md-5 input]])

(def form-template
  [:div
   (row "first name" [:input {:field :text :id :person.first-name}])
   (row "last name" [:input {:field :text :id :person.last-name}])
   (row "age" [:input {:field :numeric :id :person.age}])
   (row "email" [:input {:field :email :id :person.email}])
   (row "comments" [:textarea {:field :textarea :id :comments}])])
```

Note that we call helper functions, such as `row`, eagerly. The `bind-fields`  function will walk the template to construct the actual components that will be used by Reagent.

The `.` in the `:id` key indicates nested structure. When we have a key like `:person.first-name`, then its value will be stored under `{:person {:first-name <field-value>}}`.

Our form component will then create an atom to represent the document and bind it to the template to produce the actual form:

```clojure
(defn form []
  (let [doc (atom {})]
    (fn []
      [:div
       [:div.page-header [:h1 "Reagent Form"]]
       [bind-fields form-template doc]
       [:label (str @doc)]])))
```

That’s all there is to it. Whenever the state of any of the components changes the `doc` atom will be updated and vice versa.

The `bind-fields` function also accepts optional events. Events are triggered whenever the document is updated, and will be executed in order they are listed. Each event sees the document modified by its predecessor.
The event must take 3 parameters, which are the id, the value, and the document.

The id and the value represent the value that was changed to trigger the event, and the document is the atom that contains the state of the form. Note that the id is in form of a vector representing the path in the document. The event can either return an updated document or `nil`, when `nil` is returned then the state of the document is unmodified.
The following is an example of an event to calculate the value of the `:bmi` key when the `:weight` and `:height` keys are populated:

```clojure
(defn row [label input]
  [:div.row
    [:div.col-md-2 [:label label]]
    [:div.col-md-5 input]])

(def form-template
 [:div
   [:h3 "BMI Calculator"]
   (row "Height" [:input {:field :numeric :id :height}])
   (row "Weight" [:input {:field :numeric :id :weight}])
   (row "BMI" [:input {:field :numeric :id :bmi :disabled true}])])

[w/bind-fields
  form-template
  doc
  (fn [[id] value {:keys [weight height] :as doc}]
    (when (and (some #{id} [:height :weight]) weight height)
      (assoc-in doc [:bmi] (/ weight (* height height)))))]
```

The library provides support for a number of common fields such as inputs, checkboxes, radio buttons, lists, and multi-selects. However, it also makes it easy to add your own custom fields by implementing the `reagent-forms.core/init-field` multimethod.

The method must take two parameters, where the first parameter is the field component and the second is the options map.
The options contain two keys called  `get` and `save!`. The `get` key points to a function that accepts an id and returns the document value associated with it. The `save!` function accepts an id and a value that will be associated with it. Let’s take a look at the `:radio` field implementation as an example:
```clojure
(defmethod init-field :radio
  [[type {:keys [field id value] :as attrs} & body]
   {:keys [get save!]}]
  (let [state (atom (= value (get id)))]
    (fn []
      (into
        [type
         (merge {:type :radio
                 :checked @state
                 :class "form-control"
                 :on-change
                 #(do
                    (save! id value)
                    (reset! state (= value (get id))))}
                attrs)]
         body))))
```
As you can see, the method simply returns a new component that’s bound to the supplied id in the document. For more details please see the [documentation](https://github.com/yogthos/reagent-forms) on the project page.

The library is still rather new and as such has some rough edges, such as poor error reporting. However, I already find it to be quite useful in my own projects.
