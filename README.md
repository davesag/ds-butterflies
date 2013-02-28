ds-butterflies
==============

Ten butterflies appear in random locations and flutter about, avoiding the walls and each other. They are attracted to the light which is controlled by the mouse location. The butterflies will swarm around the light until the constant collisions with other butterflies reduces their health drops to 0 and they die, at which point a new butterfly will be created.

## Philosophy

> There is no free will, only free won't

I was inspired by [Douglas Hofstadter](http://en.wikipedia.org/wiki/Douglas_Hofstadter) and his claims that there is no free will, (only free won't) to develop a simple system comprising agents that are equipped with senses that excite or depress urges, and the firing of those urges causes the agents to act. By simply wiring up senses to urges, and allowing the urges to fire according to a probabilistic model, one can make the agent seem like it has free-will and intention, where in fact no such intentionality exists.

## The basic wiring.

A Butterfly object has five primary urges and two sensing organs (i.e. eyes). Each eye looks ahead 200px and to the left or right by 45° and if it detects either an edge, or another butterfly, excites the opposing turn urge. Each eye also looks for the mouse location, and if the eye is facing the mouse, it excites the butterfly's matching turn urge as well as the accelerate urge, otherwise it excites the butterfly's decelerate urge.

Urges have an energy level (starts at 0) and a threshold.  If the energy level exceeds the threshold level then the threshold is increased. The energy level represents a probability of the urge firing. When an urge fires it's specific action is enacted and its energy is reset to 0. If an urge fails to fire it's idle state is triggered, giving it a chance to reduce its firing threshold.

### Urges

1. move — move the butterfly forwards (with slight random walk introduced)
2. accelerate — increase the butterfly's speed, with no maximum.
3. decelerate — decrease the butterfly's speed, keeping it 0 or greater.
4. turn-left - rotate the butterfly 45° to the left.
5. turn-right - rotate the butterfly 45° to the right.

### Senses

1. left-eye — sense edges or other butterflies to the left (within 200px range), and if anything is seen excite the turn-right urge. Also senses the mouse location and if it's to the front and left then excite the turn-left and accelerate urges.
2. right-eye — sense edges or other butterflies to the right (within 200px range), and if anything is seen excite the turn-left urge. Also senses the mouse location and if it's to the front and right then excite the turn-right and accelerate urges.

### Lifecycle

1. If there are less than BUTTERFLY_MAX butterflies then create a new one at a random location, facing in a random direction.
2. run each butterfly's `go()` method.
3. repeat this every 20ms

Each butterfly's `go()` method does the following:

1. test the health of the butterfly. If it is 0 (or less) then the butterfly will `die()`.
2. run the `go()` method for the left and right eye senses in a random order — this will excite some urges.
3. run the `go()` method for all of the urges in a random order. — Some urges may fire depending on their energy level and thresholds. If the urge doesn't fire then its `idle()` method is run which has a chance of reducing the urge's threshold.

Each eye-sense's `go()` method does the following:

1. check the `repel.test()` condition and if true perform the sense's `repel.pro()` action, else perform the sense's `repel.anti()` action.
2. check the `attract.test()` condition and if true perform the sense's `attract.pro()` action, else perform the sense's `attract.anti()` action.
3. excite the move urge.

Each urge's `go()` method simply

1. tests if the urge should fire, and if it should,
2. depress the urge, and
3. trigger the urge's `action()`, otherwise
4. trigger the urge's `idle()`.
