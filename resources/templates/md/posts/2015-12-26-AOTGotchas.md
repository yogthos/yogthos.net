{:title "Trouble with AOT"
 :layout :post
 :tags ["clojure" "luminus"]}
 
I recently ran into an interesting issue when I added the [slf4j-timbre](https://github.com/fzakaria/slf4j-timbre) dependency to a project. As soon as the dependency was added the project would fail to build and I'd see the following error:

```
Caused by: java.io.FileNotFoundException: Could not locate clojure/tools/reader/impl/ExceptionInfo__init.class or clojure/tools/reader/impl/ExceptionInfo.clj on classpath.
```

The `slf4j-timbre` library does not depend on `clojure.tools.reader`, and at first glance there's nothing in it that should've caused problems. I did notice that the library depends on `com.taoensso/timbre 4.1.4` that in turn depends on `com.taoensso/encore 2.18.0`, and it uses on an older version of `clojure.tools.reader`.

At this point I thought the solution would be simple. I'd just include the latest version of `encore` and everything should work fine. However that didn't turn out to be the case.

I decided to take another look at `slf4j-timbre` to see what else might be happening. At this point I noticed that it uses `:aot :all` in the project configuration. This causes the library to be compiled to Java classes as opposed to being distributed at source. This is necessary since the library has to implement the SLF4J interface and has to provide a Java class in its implementation.

When the namespace that references `Timbre` is compiled then any namespaces it depends on are also compiled and packaged in the `jar`. These compiled classes will take precedence over the source dependencies when the library is included in the project.

So, even though I was explicitly including the version of `encore` that uses the latest `clojure.tools.reader`, the compiled version packaged in `slf4j-timbre` would end up being used causing the exception above. As far as I can tell there's no way to overwrite these in the project configuration.

### Implications for Luminus

Unfortunately, Luminus dependencies require both a SLF4J compliant logger and the latest `clojure.tools.reader`. While I think `Timbre` is an excellent library, it's just not the right fit at the moment.

Luckily, [clojure.tools.logging](https://github.com/clojure/tools.logging) provides a SLF4J compliant API for Clojure logging. The latest release of Luminus uses `clojure.tools.logging` along with the [log4j](https://logging.apache.org/log4j/2.x/) library as the default logging implementation. It's a mature library that has excellent performance and provides a [plethora of logging appenders](https://logging.apache.org/log4j/2.x/manual/appenders.html).


Since `log4j` can be configured using a properties file, it fits the Luminus approach of using 12 factor style configuration. The library will look for a file called `log4j.properties` on the classpath to get its default configuration. Luminus packages this file in the `resources` folder with the following configuration:

```
### stdout appender
log4j.appender.stdout=org.apache.log4j.ConsoleAppender
log4j.appender.stdout.Target=System.out
log4j.appender.stdout.layout=org.apache.log4j.PatternLayout
log4j.appender.stdout.layout.ConversionPattern=[%d][%p][%c] %m%n

### rolling file appender
log4j.appender.R=org.apache.log4j.RollingFileAppender
log4j.appender.R.File=./log/app-name.log

log4j.appender.R.MaxFileSize=100KB
log4j.appender.R.MaxBackupIndex=20

log4j.appender.R.layout=org.apache.log4j.PatternLayout
log4j.appender.R.layout.ConversionPattern=[%d][%p][%c] %m%n

### root logger sets the minimum logging level
### and aggregates the appenders
log4j.rootLogger=DEBUG, stdout, R
```

As you can see the configuration is very straight forward, it's also [well documented](https://logging.apache.org/log4j/2.x/manual/configuration.html#Properties). The default configuration can be overridden at runtime by setting the `:log-config` environment variable. You can now create a custom logging configuration on the target system and then set an environment variable to point to it as seen below:

```
export LOG_CONFIG=prod-log.properties
```

I think that the new approach provides a solid solution for most situations with minimal changes from the existing behavior.

### Final Thoughts

The moral of the story is that you want to be very careful when using AOT in libraries. Whenever possible it is best to avoid it, and if you do have to use it then try to find the minimal subset of the namespaces that absolutely have to be compiled.