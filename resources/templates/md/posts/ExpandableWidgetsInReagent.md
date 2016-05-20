{:title "Writing an expandable widget with Reagent", :layout :post, :tags ["reagent"]}

I recently needed to create an expandable widget and I wanted to be able to close it by clicking elsewhere on the screen. An example would be an input field and an associated component to select the input value such as a date picker.

We'll define an example component to look as follows:

```clojure
(defn expandable-component []
  [:div
   [:input
    {:type :text}]
   [:table>tbody      
    (for [row (range 5)]
      [:tr
       (for [n (range 5)]
         [:td>button.btn
          {:on-click
           #(do
              (reset! value n)
              (reset! expanded? false))} n])])]])
```

Next, we'll use the `with-let` statement to define some state for the component.

```clojure
(defn expandable-component1 []
  (r/with-let
    [expanded? (r/atom false)
     value     (r/atom nil)]
    [:div
     [:input
      {:type :text
       :value @value
       :on-click #(swap! expanded? not)}]
     [:table>tbody
      {:style (if @expanded?
                {:position :absolute}
                {:display "none"})}
      (for [row (range 5)]
        [:tr
         (for [n (range 5)]
           [:td>button.btn.btn-secondary
            {:on-click
             #(do
                (reset! value n)
                (reset! expanded? false))} n])])]]))
```

The table is now hidden by default, and it's displayed when the user clicks the input. The table contains cells with numbers. When the user clicks a number, then the table is hidden and the input is reset to the value selected.

This works fine. However, the only way we can hide the table is by either picking a number or clicking on the input itself. It's not terrible, but it would be nicer if we could simply click off the table to have it go away.

The problem is that there is no local event the widget can use to detect that the user clicked elsewhere. So, what can we do here?

The solution I ended up using was to use a combination of events to detect the state of the widget. Let's see how this works below.

First, I added the `:on-blur` event to the input. When the input loses focus, the table is hidden. Now if I click elsewhere on the screen the table will disappear as intended.

Unfortunately, this breaks the interaction with the table itself. Since now the focus goes away and I'm no longer able to select the number I want.

In order to get around that problem we can use the `:on-mouse-enter` and `:on-mouse-leave` events on the table. This way we can check if the mouse is in the table before changing the visibility.

```clojure
(defn expandable-component []
  (r/with-let
    [expanded? (r/atom false)
     value     (r/atom nil)
     mounse-on-table? (r/atom false)]
    [:div
     [:input
      {:type :text
       :value @value
       :on-click #(swap! expanded? not)
       :on-blur #(when-not @mounse-on-table? (reset! expanded? false))}]
     [:table>tbody
      {:style (if @expanded? {:position :absolute} {:display "none"})
       :on-mouse-enter #(reset! mounse-on-table? true)
       :on-mouse-leave #(reset! mounse-on-table? false)}
      (for [row (range 5)]
        [:tr
         (for [n (range 5)]
           [:td>button.btn.btn-secondary
            {:on-click
             #(do
                (reset! value n)
                (reset! expanded? false))} n])])]]))
```

The new approach works as intended. The table will now close whenever the user clicks outside it.

Hopefully this trick will save you some time creating these types of components in Reagent.





