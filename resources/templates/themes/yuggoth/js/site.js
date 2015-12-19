$("#cpyear").text(new Date().getFullYear());

new Headroom(document.getElementById("header"), {
  "offset": 205,
  "tolerance": 5,
  "classes": {
    "initial": "animated",
    "pinned": "slideDown",
    "unpinned": "slideUp"
  }
}).init();

$("#menu").children().each(
      function() {
        var location = window.location.pathname;
        var href = $(this).children().first().attr("href");
        if (location.indexOf(href) > -1)
          $(this).addClass("selected");
        else
          $(this).removeClass("selected");
    });
