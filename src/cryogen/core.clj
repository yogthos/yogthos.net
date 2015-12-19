(ns cryogen.core
  (:require 
   [cryogen-core.plugins :refer [load-plugins]]
   [cryogen-core.compiler :refer [compile-assets-timed]]))

(defn -main []
  (load-plugins)
  (compile-assets-timed)
  (System/exit 0))
