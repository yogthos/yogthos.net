{:title "Luminus is Migrating to Migratus",
 :layout :post,
 :tags ["luminus" "clojure"]}
 
There was a recent discussion on [google groups](https://groups.google.com/forum/#!topic/luminusweb/rRJYbyUOKAY) regarding migrations and handling of database credentials in Luminus. Up to now, Luminus would generate a template where the database credentials were hardcoded in the `<app>.db.core` namespace and migrations were handled by the [ragtime.lein](https://github.com/weavejester/ragtime/tree/0.3/ragtime.lein) plugin.

This was not ideal for a couple of reasons. First, the hardcoded credentials aren't great for any serious applications. The credentials end up being checked in the code repository and have to be manually updated for each environment the application runs in. Second, you end up with separate sets of database configuration for the application and for the plugin. This is error prone as it puts the burden on the user to keep the credentials in sync.

The proposed approach was to use the `profiles.clj` instead to keep a single set of credentials for development. The production credentials would then be supplied using environment variables. This is a much cleaner approach to handling credentials as they're no longer part of the code and can be configured in a single place.
 
In the meantime, Ragtime had a new major version release [0.4.0](https://github.com/weavejester/ragtime) that introduces a number of changes. Ragtime is moving away from using a Leiningen plugin, and instead recommends [running the commands from the REPL](https://github.com/weavejester/ragtime/wiki/Leiningen-Integration). The other major change is that it[ no longer allows multiple statements  in a single migrations file](https://github.com/weavejester/ragtime/wiki/SQL-Migrations#sql).
 
 The rationale here is that different SQL databases have different restrictions on the commands that can be sent in a single message. Therefore using a heuristic to split up migrations isn't guaranteed to work correctly across different database engines.
 
 While this is true, in my view it also results in subpar user experience. While it's ok for trivial migrations, such as the ones seen in the examples, it doesn't scale well for larger ones. I think that there is a lot of value in being able to see the entirety of a migration in a single place without having to jump across multiple files.
 
 **update:** Since the writing of the post, Ragtime has [added](https://github.com/weavejester/ragtime/commit/eea75fcfc1a6d51c28bfb9dc58540a842f2111d5) the ability to use a custom separator, so it should be available in the next release.
 
At this point I decided to see what other migrations libraries were available and to evaluate if any of them would be a good fit for the workflow that Luminus aims to provide. The one I settled on was [Migratus](https://github.com/pjstadig/migratus). It provides a workflow that's nearly identical to the original Ragtime based one that Luminus used.

Migrtus elegantly addresses the problem of splitting up statements by using a custom separator `--;;` to identify individual statements within the file. This removes the ambiguity of having to infer where one statement ends and another begins without forcing the user to split their migrations into multiple files.

Unfortunately, Migratus has not been maintained for the past two years and relied on a deprecated version of the `clojure.java.jdbc` library. Since Migratus already works well and it's a relatively simple library I decided to see if I could bring it up to date.

This turned out to be a relatively painless process and I ended up making some minor changes and improvements along the way. I contacted Paul Stadig, who is the author of the library, and he graciously agreed to transfer the ownership as he's no longer planning on developing it himself. I've released the updated library to Clojars and the latest version of Luminus uses Migratus to handle migrations.

As I mentioned earlier, using a Leiningen plugin to handle dev migrations requires dupliction of credentials. Instead, Luminus now provides an `<app>.db.migrations` namespace that manages migrations. This namespace is invoked from the `<app>.core/-main` when it's passed in `migrate` or `rollback` arguments. These arguments can be optionally followed by the migration ids in order to apply specific migrations. So, when previously you would run `lein ragtime migrate`, you'd now run `lein run migrate` to apply migrations.

Since this code is now part of the project it can now be run from the packaged `uberjar` as well. This allows the application to run its migrations on the server without necessitating a separate process for migrating the production database. Complete migrations documentation is available on [the offical Luminus site](http://www.luminusweb.net/docs/migrations.md).

Having a straight forward way to run migrations and store credentials securely, taking into account production environments, is an important aspect of providing a solid base for developing web applications.