{:title "making reporting easy", :layout :post, :tags []}

There are a bunch of reporting options out there, [JasperReports](http://community.jaspersoft.com/project/jasperreports-library) is one popular example. While it's got a ton of features, it often involves a disproportionate amount of effort to create even the simplest of reports. [Here's](http://java-bytes.blogspot.ca/2009/06/jasper-reports-example.html) what's involved in simply printing out some fields from the database to a PDF.

Let's see if we can make things easier with Clojure. We'll produce the same report as the one in the linked example.

First, we'll create our database connection using [java.jdbc](https://github.com/clojure/java.jdbc).

```clojure
(def db {:classname "org.postgresql.Driver"
           :subprotocol "postgresql"
           :subname "//localhost:5432/testdb"
           :user "user"
           :password "secret"})
```
then we'll make an employee table and populate it with the sample data

```clojure
(defn create-employee-table []
  (sql/create-table
    :employee
    [:name "varchar(50)"]
    [:occupation "varchar(50)"]
    [:place "varchar(50)"]
    [:country "varchar(50)"]))

(sql/with-connection 
  db
  (create-employee-table)
  (sql/insert-rows 
    :employee
    ["Babji, Chetty", "Engineer", "Nuremberg", "Germany"]
    ["Albert Einstein", "Engineer", "Ulm", "Germany"]
    ["Alfred Hitchcock", "Movie Director", "London", "UK"]
    ["Wernher Von Braun", "Rocket Scientist", "Wyrzysk", "Poland (Previously Germany)"]
    ["Sigmund Freud", "Neurologist", "Pribor", "Czech Republic (Previously Austria)"]
    ["Mahatma Gandhi", "Lawyer", "Gujarat", "India"]
    ["Sachin Tendulkar", "Cricket Player", "Mumbai", "India"]
    ["Michael Schumacher", "F1 Racer", "Cologne", "Germany"]))
```
finally we'll write a function to read the records from the table.

```clojure
(defn read-employees []
  (sql/with-connection db 
    (sql/with-query-results rs ["select * from employee"] (doall rs))))
```
Let's run `read-employees` to make sure everything is working as expected, we should see something like the following:

```clojure
(clojure.pprint/pprint (read-employees))

({:country "Germany",
  :place "Nuremberg",
  :occupation "Engineer",
  :name "Babji, Chetty"}
 {:country "Germany",
  :place "Ulm",
  :occupation "Engineer",
  :name "Albert Einstein"}
  ...)
```
You'll notice that the result is simply a list of maps where the keys are the names of the columns in the table.

We're now ready to generate our report, [clj-pdf](https://github.com/yogthos/clj-pdf) provides a `template` macro, which uses `$` to create anchors which are populated from the data using the keys of the same name. 

The template returns a function which accepts a sequence of maps and applies the supplied template to each element in the sequence. In our case, since we're building a table, the template is simply a vector with the names of the keys for each cell in the row.

```clojure
(def employee-template 
  (template [$name $occupation $place $country]))
```
if we pass our data to the template we'll end up with the following:

```clojure
(employee-template (take 2 (read-employees)))

(["Babji, Chetty" "Engineer" "Nuremberg" "Germany"] 
 ["Albert Einstein" "Engineer" "Ulm" "Germany"])
```
All that's left is to stick this data into our report:

```clojure
(pdf
 [{}
  (into [:table 
         {:border false
          :cell-border false
          :header [{:color [0 150 150]} "Name" "Occupation" "Place" "Country"]}]
        (employee-template (read-employees)))]
 "report.pdf")
```

here's the result of running the above code, which looks just as we'd expect:

![table report](/files/report1.png)

It only took a few lines to create the report and we can see and manipulate the layout of the report in one place. Of course, the template we used for this report was completely boring, so let's look at another example. Here we'll output the data in a list, and style each element:

```clojure
(def employee-template-paragraph 
  (template 
    [:paragraph 
     [:heading $name]
     [:chunk {:style :bold} "occupation: "] $occupation "\n"
     [:chunk {:style :bold} "place: "] $place "\n"
     [:chunk {:style :bold} "country: "] $country
     [:spacer]]))
```

when writing the report, we can mix the templated elements with regular ones:

```clojure
(pdf 
  [{:font {:size 11}}      
   [:heading {:size 14} "Employees Test"]
   [:line]
   [:spacer]
   (employee-template-paragraph (read-employees))]
  "report.pdf")
```
here's the new report with the fancy formatting applied to it:

![list report](/files/report2.png)

I think that this approach provides a lot of flexibility while keeping things concise and clear. In my experience there are many situations where all you need is a simple well formatted report, and the effort to create that report should be minimal.
