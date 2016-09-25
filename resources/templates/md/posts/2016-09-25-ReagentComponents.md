{:title "Reusable Components"
 :layout :post
 :tags ["clojure" "re-frame" "reagent"]}

One of the projects my team works is a clinical documentation platform. The goal of the project is to facilitate the implementation of different kinds of workflows for the clinics at our hospital.

## Requirements

One major requirement for the platform is support for multiple concurrent users working on the same document. For example, both a physician and a pharmacist may have to enter the prescribed medications for a patient. Both users have to be able to complete their work concurrently and to be aware of the changes made by the other.

Another requirement is to visualize the data differently depending on the discipline. Patient lab results may need to be shown as a table in one place, but as a trending chart in another. A physician may call a piece of data by one name, while the pharmacist calls it by another.

In other words, the data model needs to have different views associated with it. Furthermore, some information may not be shown in a particular view at all, but it would still need to be updated when a field in the view changes.

Consider an example where you're collecting patient height and weight, then the BMI is calculated based on that. The user may only be interested in seeing height and weight in their workflow, but once that data changes the BMI still needs to be recalculated even if it's not displayed in that view.

Finally, we have a large data model based on the [Hl7 FHIR](https://www.hl7.org/fhir/) standard. This standard specifies resources for describing different kinds clinical data, such as patient demographics, medications, allergies and so on. An example of a resource definition can be seen in the [Resources](https://www.hl7.org/fhir/resourcelist.html) section.

## Architecture

The concurrent user requirement means that the changes made by different users have to be kept in sync. Meanwhile, business rules have to be applied transactionally for each change.

The easiest way to address the above requirements is to keep the master document on the server. Any time a client makes a change, a request is sent to the server over a WebSocket. The server updates the field in the document and runs the business rules. It will then notify the clients viewing a particular document of all the fields that were updated in the transaction.

The clients simply reflect the state of the document managed by the server and never make local updates to the model. This ensures that all the changes are handled centrally, and that the business rules are applied regardless of what is displayed on the client.

The second problem is the creation of views for the data. Since we have many distinct fields, but only a small number of types of fields, it made sense for us to create widgets to represent specific data types. The widgets are bound to the fields in the data model using the path as a unique identifier.

Let's take a look at a [sample project](https://github.com/yogthos/components-example) that illustrates the above architecture to see how this works in practice.

## Server-Side State Management

We'll start by examining the server-side implementation of the architecture starting with the [components-example.document](https://github.com/yogthos/components-example/blob/master/src/clj/components_example/document.clj) namespace. The server in our example keeps its state in a `ref`, and updates it transactionally whenever it receives an update from the client.

```clojure
(defonce document (ref {}))

(defn bmi [weight height]
  (when (and weight height (pos? height))
    (/ weight (* height height))))

(defn bmi-rule [doc]
  (let [weight (get-in doc [:vitals :weight])
        height (get-in doc [:vitals :height])]
    [{:path  [:vitals :bmi]
      :value (bmi weight height)}]))

(def rules
  {[:vitals :weight] bmi-rule
   [:vitals :height] bmi-rule})

(defn run-rules [doc {:keys [path]}]
  (when-let [rule (rules path)]
    (rule doc)))

(defn update-document! [{:keys [path value] :as path-value}]
  (dosync
    (let [current-document (alter document assoc-in path value)
          updated-paths    (run-rules current-document path-value)]
      (doseq [{:keys [path value]} updated-paths]
        (alter document assoc-in path value))
      (into [path-value] updated-paths))))
```

Note the use of the `dosync` block in the `update-document!` function to update the document and run the business rules as a transaction.

Each rule can in turn create additional changes in the document. A vector of updated `path-value` pairs is returned as the result of the update. Our setup has a single rule that calculates the BMI. This rule is triggered whenever the weight or height fields are changed.

While the example keeps the document in memory, there's nothing stopping us from keeping it in the database and running the updates using a transaction against it. This is especially easy to do with PostgreSQL as it supports working with individual JSON fields directly.


## Client-Server Communication

When the client loads, it establishes a WebSocket connection with the server. This connection is used to notify the server of the user actions and to push the changes back to the clients.

Server side of the connection can be found in the [components-example.routes.ws](https://github.com/yogthos/components-example/blob/master/src/clj/components_example/routes/ws.clj) namespace. The part that's of most interest to us is the `handle-message` multimethod that's keyed on the `:document/update` event:

```clojure
(defmethod handle-message :document/update [{:keys [?data]}]
  (let [updated-paths (update-document! ?data)]
    (doseq [uid (-> @socket :connected-uids deref :any)]
      ((:send-fn @socket) uid [:document/update updated-paths]))))
```

The multimethod calls the `update-document!` function we just saw and then notifies the connected clients with its result.

Conversely, the client portion of the WebSocket connection is found in the [components-example.ws](https://github.com/yogthos/components-example/blob/master/src/cljs/components_example/ws.cljs) namespace. Here we have the `update-value` function that sends the update event to the server, and the `handle-message` multimethod that handles incoming update messages:

```clojure
(defn update-value [path-value]
  ((:send-fn @socket) [:document/update path-value]))

(defmethod handle-message :document/update [[_ updated-paths]]
  (doseq [{:keys [path value]} updated-paths]
    (dispatch [:set-doc-value path value])))
```

The multimethod dispatches a re-frame event for each path/value pair in the message. Let's take a look at the re-frame handlers and subscriptions next.

## Client-Side State Management

Re-frame handlers are found in the [components-example.handlers](https://github.com/yogthos/components-example/blob/master/src/cljs/components_example/handlers.cljs) namespace, where the document state is updated using the following handlers:

```clojure
(reg-event-db
  :set-doc-value
  (fn [db [_ path value]]
    (assoc-in db (into [:document] path) value)))

(reg-event-db
  :save
  (fn [db [_ path value]]
    (ws/update-value {:path path :value value})
    db))
```

The `:save` event creates a WebSocket call to notify the server of the change. Meanwhile, the `:set-doc-value` event is used to update the client state with the set of changes. This event will be triggered by a WebSocket message from the server, whenever the master document is updated.

We also need to have a corresponding subscription to view the state of the document. This subscription is found in the [components-example.subscriptions](https://github.com/yogthos/components-example/blob/master/src/cljs/components_example/subscriptions.cljs) namespace:

```clojure
(reg-sub
  :document
  (fn [db [_ path]]
    (let [doc (:document db)]
      (if path (get-in doc path) doc))))
```

Next, let's take a look at how the UI components are defined and associated with the data model.

## Application Components

The UI for the application consists of widgets representing individual data types. When a widget is instantiated it's associated with a particular path in the document. The widgets are found in the [components-example.widgets](https://github.com/yogthos/components-example/blob/master/src/cljs/components_example/widgets.cljs) namespace.

The set of all valid paths is contained in the [components-example.model](https://github.com/yogthos/components-example/blob/master/src/cljc/components_example/model.cljc) namespace. This namespace is written using CLJC, and provides a single schema for both the client and the server portions of the application.

The widgets are associated with the model using the [components-example.model-view](https://github.com/yogthos/components-example/blob/master/src/cljs/components_example/model_view.cljs) namespace. Each of the paths found in the model can have multiple views associated with it. In our example, we have the form for entering the data and a preview for displaying it.

Finally, we have the [components-example.view](https://github.com/yogthos/components-example/blob/master/src/cljs/components_example/view.cljs) namespace that provides the layout for the page. This namespace instantiates the widgets defined in the `model-view` namespace and lays them out as needed for a particular page in the application.

Let's explore each of these namespaces in detail below.

### Model

The data model in our application consists of a map that's keyed on the element path where each key points to the type of data found in that element. Let's take a look at a simple demographics model below:

```clojure
(def Name
  {:first s/Str
   :last  s/Str})

(def demographics
  {[:demographics :mrn]
   s/Str
   
   [:demographics :name]
   Name

   [:demographics :name :dob]
   #?(:clj java.util.Date
      :cljs js/Date)

   [:demographics :address :province]
   (s/enum "AB" "BC" "MB" "NB" "NL" "NS" "NT" "NU" "ON" "PE" "QC" "SK" "YT")})
```

We can see that the demographics model contains the name, the date of birth, and the province for the patient.

The paths can point to any type of data structure. For example, the `[:demographics :name]` path points to a map containing the first and the last name.

Meanwhile, the `[:demographics :name :dob]` path leverages CLJC to provide different validators for Clojure and ClojureScript.

### Widgets

Now, let's take a look at the approach we took to map the FHIR data model to the UI in the application.

At the lowest level we have widgets that represent a particular type of element. These would include text fields, datepickers, dropdowns, tables, and so on. The way we chose to represent the widgets was to use multimethods. The widgets are initialized using a map containing the `:type` key:

```clojure
(defmulti widget :type)
```

Given the multimethod definition above, a text input widget might look as follows:

```clojure
(defmethod widget :text-input [{:keys [label path]}]
  (r/with-let [value    (r/atom nil)
               focused? (r/atom false)]
    [:div.form-group
     [:label label]
     [:input.form-control
      {:type      :text
       :on-focus  #(do
                    (reset! value @(rf/subscribe [:document path]))
                    (reset! focused? true))
       :on-blur   #(do
                    (rf/dispatch
                      [:save path @value])
                    (reset! focused? false))
       :value     (if @focused? @value @(subscribe-doc path))
       :on-change #(reset! value (-> % .-target .-value))}]]))
```

The text input widget subscribes to the given path in the document as its value. Since we don't want to generate unnecessary WebSocket events while the user is typing, the input keeps a local state while it's focused.

When the user focuses the input, its local state is set to the current document state, and when the focus is lost, the update event is generated with the new value.

Each widget is a reusable component that is associated with a path in the document to create a concrete instance:

```clojure
[widget {:type :text-input
         :lable "first name"
         :path [:patient :name :first]}]
```

Since the widgets are mapped to the data elements via the path when instantiated, they can easily be composed into larger components. For example, we'll create a patient name component using two `:text-input` widgets:

```clojure
(defmethod widget :name [{:keys [first-name last-name path]}]
  [:div
   [widget {:label first-name
            :type :text-input
            :path (conj path :first)}]
   [widget {:label last-name
            :type :text-input
            :path (conj path :last)}]])
```

Composite widgets provide us with the ability to describe complex data elements that are common among different resources.

### Model-View

The widgets are associated with the concrete paths using a model-view map. This map is keyed on the same paths as the model map, but points to widget declarations instead of the types. We can represent the MRN and name fields as follows:

```clojure
(def demographics-form
  {[:demographics :mrn]
   {:label "medical record number"
    :type  :text-input}
    
   [:demographics :name]
   {:first-name "first name"
    :last-name  "last name"
    :type       :name}})
```

The model/view map contains a set of UI elements for representing the data model. Note that this approach allows us to create multiple view definitions for any particular data element.

This is useful as we may wish to present the data differently depending on the use case. For example, some users may manipulate the data, while others will simply want to view it.

### View

This brings us to the view portion of the architecture. The view aggregates the widgets defined in the model-view map into a particular layout. The demographics view could look as follows:

```clojure
(defn create-widget [view path]
  (let [opts (view path)]
    [widget (assoc opts :path path)]))

(defn form-row [view path]
  [:div.row>div.col-md-12
   (create-widget path)])
   
(defn demographics [view]
  [:div
   (form-row demographics-form [:demographics :mrn])
   (form-row demographics-form [:demographics :name])])
```

Here we use a `create-widget` helper function that looks up the options for a widget in the view and instantiate it with the given path.

The widgets are then wrapped in the layout tags in the `form-row` and inserted in the the `div` that represents the demographics view.

Once the widgets are defined, it becomes trivial to create different kinds of interfaces using them. This is perfect for our use case where we have a large common data model with many different views into it.

## Conclusion

I hope this provides a bit of an insight into building large UIs with reusable components using Reagent and re-frame. My team has found that this approach scales very nicely and allows us to quickly build different kinds of UIs against a common data model.

