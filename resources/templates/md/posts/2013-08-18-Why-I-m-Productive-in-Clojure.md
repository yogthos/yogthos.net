{:title "Why I'm Productive in Clojure",
 :layout :post,
 :tags ["clojure"]}

I find that I often get excited about learning a new language, but after I use it for a while it will inevitably lose its lustre. Eventually it becomes just another language in my tool box. 

One exception to this rule is Clojure. I still enjoy using the language as much as I did when I first learned it. The reason for this is that it strikes the right balance between power and simplicity.

### The Balance of Power

Some languages are simple but they're also verbose. You've probably heard people say that verbosity really doesn't matter. These people will go to great length to point out that all languages are Turing complete and that in certain languages you simply have to write a bit more code.

I think that's missing the point however. The question is not whether something can be expressed in principle. It's how well the language maps to the problem being solved. One language will let you think in terms of your problem domain, while another will force you to translate the problem to its constructs.

The latter is often tedious and rarely enjoyable. You end up writing a lot of boilerplate code and constantly repeating yourself. I hope you'll agree that there is a certain amount of irony involved in having to write repetitive code.

Other languages aren't verbose and they provide many different tools for solving problems. Unfortunately, working in such languages is often akin to trying to decide on a particular set of screwdrivers at a hardware megastore.

You end up comparing this brand against that, checking the number of bits that comes with each set, seeing which one's on sale today, and soon you forget why you wanted a screwdriver in the first place. 

The more features there are the more things you have to keep in your head to work with the language effectively. With many languages I find myself constantly expending mental overhead thinking about all the different features and how they interact with one another.

What matters to me in a language is whether I can use it without thinking about it. When the language is lacking in expressiveness I'm acutely aware that I'm writing code that I shouldn't be. On the other hand when the language has too many features I often feel overwhelmed or I get distracted playing with them.

To make an analogy with math, it's nicer to have a general formula that you can derive others from than having to memorize a whole bunch of formulas for specific problems.

This is where Clojure comes in. With it I can always easily derive a solution to a particular problem from a small set of general patterns. The number of things I have to keep in my head is not overbearing.

All you need to become productive is to learn a few simple concepts and a bit of syntax. However, the number of ways that these concepts can be combined to solve all manner of problems appears to be inexhaustible. I've been writing Clojure for years and I discover new ways to combine the things I already know every single day.

Macros are a good example of this. The fact that you can transform the language using itself allows tackling a wide range of problems that would otherwise require a range of specific tools and language features.

### Interactive Development

When I'm solving a problem in Clojure I inevitably want to write an elegant solution that expresses the gist of it cleanly and clearly. This is largely due to the fact that the development process is interactive. 

When I work with the REPL I can fumble around looking for a solution and make sense of it through experimentation. Once I've internalized the problem I can quickly write a clean solution using my newly gained understanding.

The REPL also helps keep me engaged in trying to find the solution. Being able to try things and get immediate feedback is enjoyable. Even when your code doesn't do what you want you can see the progression and that is often enough of a motivator to keep going.

Another important feature of the REPL is that it encourages refactoring. I'm much more likely to refactor code when I can easily test it without disrupting my workflow.

### Finishing Things

Interactivity alone isn't enough however. All the feedback in the world wouldn't make one bit of difference if you couldn't actually solve your problem in a reasonable amount of time.

I find that I have a sharp falloff curve when it comes to staying engaged in a project. You've probably noticed this phenomenon yourself. When you start a project you're excited and you enjoy seeing it take shape.

However, after working on a project for some amount of time the excitement wanes. Eventually, you might even dread having to touch the code again. I find that it's critical to get the core functionality working before I hit this stage.

Once the project solves a particular problem that I have I'll start using it. At this point I get to reap the benefits of having spent the effort on it. This also lets me identify the functionality that I'm missing through usage. There is a lot more incentive to add features to a project that you're actually using.

Most recently I found this to be the case working on [Selmer](https://github.com/yogthos/Selmer). I was able to implement the base parser in just a couple of days, while [cesarbp](https://github.com/cesarbp) implemented the logic for the filters.

It took a couple of more days to get the template inheritance logic working. All of a sudden we had a usable library in under a week of effort. I'm already actively using it for actual work and new features are added piecemeal as the need comes up.

Here's the GitHub [activity](https://github.com/yogthos/Selmer/graphs/code-frequency) graph for Selmer:

[![Selmer activity](http://yogthos.net/files/selmercommits.png)](https://github.com/yogthos/Selmer/graphs/code-frequency)

As you can see there's a big initial spike with a very sharp falloff. A similar patten can be seen in my other projects such as [clj-pdf](https://github.com/yogthos/clj-pdf) and with [Luminus](https://github.com/yogthos/luminus):

[![clj-pdf activity](http://yogthos.net/files/clj-pdfcommits.png)](https://github.com/yogthos/clj-pdf/graphs/code-frequency)

[![Luminus activity](http://yogthos.net/files/luminuscommits.png)](https://github.com/yogthos/luminus/graphs/code-frequency)

As the project matures bugs are inevitably found or new features are added, these correspond the occasional spikes in the activity. However, if the initial phase of the project can't be completed in a timely fashion then nothing else can happen.

In my experience, if you can't get something interesting working in a few days the likelihood of actually finishing the project starts rapidly approaching zero.

With Clojure you can get things done fast, fast enough that you get something working while the initial spark of excitement is still present. I would hazard to guess that this is the reason why Clojure has so many great libraries despite being a young language.
