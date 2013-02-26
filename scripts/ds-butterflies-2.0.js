var BUTTERFLIES = [],
    BUTTERFLY_MAX = 10,
    a_butterfly = null;

function randomInt(limit) {
  // returns a random integer between 1 and 'limit'
  return Math.round(Math.random() * (limit - 1)) + 1
}

function projected_point(point, direction, range) {
  var alpha = direction * Math.PI / 4,
      x = point[0] + (range * Math.sin(alpha)),
      y = point[1] - (range * Math.cos(alpha));
  return [x, y];
}

function rotate_left(directon, count) {
  var result = direction - count;
  if (result < 0) result += 7;
  return result;
}

function rotate_right(directon, count) {
  var result = direction + count;
  if (result > 7) result -= 7;
  return result;
}

function AbstractUrge(butterfly) {
  this.butterfly = butterfly;
  this.energy = 0;
  this.threshold = 0;
  this.limit = 100;
  this.fire = function() {
    return (randomInt(this.limit + this.energy) < this.threshold)
  };
  this.excite = function() {
    if (++this.energy > this.threshold) this.threshold++
    this.go();
  };
  this.depress= function() {
    this.energy = 0;
    this.threshold = 0;
  };
  this.idle = function() {
    if (randomInt(this.threshold) < (this.threshold - this.energy)) this.threshold--
  };
  this.action = function() {};
  this.go = function() {
    if (this.fire()) {
      // console.log('urge fired for', this);
      this.depress();
      this.action();
    }
  }
}

function MoveUrge(butterfly) {
  this.base = AbstractUrge;
  this.base(butterfly);
  this.action = function() {
    this.butterfly.move();
  }
}

function TurnLeftUrge(butterfly) {
  this.base = AbstractUrge;
  this.base(butterfly);
  this.action = function() {
    this.butterfly.turn_left();
  }
}

function TurnRightUrge(butterfly) {
  this.base = AbstractUrge;
  this.base(butterfly);
  this.action = function() {
    this.butterfly.turn_right();
  }
}

function AccelerateUrge(butterfly) {
  this.base = AbstractUrge;
  this.base(butterfly);
  this.action = function() {
    this.butterfly.accelerate();
  }
}

function DecelerateUrge(butterfly) {
  this.base = AbstractUrge;
  this.base(butterfly);
  this.action = function() {
    this.butterfly.decelerate();
  }
}

// if an eyesense 'sees' something in front of it stimulate the opposite turn urge,
// and stimulate the decelerate urge.
// else stimulate the accelerate urge.
// eyes can see the edge of the window, and other butterflies.
function EyeSense(butterfly, side) {
  this.butterfly = butterfly;
  this.side = side;
  this.range = 200;         // 200px.
  this.see = function() {
    // return true if this eye can 'see' the edge or another butterfly.
    var pos = this.butterfly.position(),
        alpha = this.direction * Math.PI / 4,
        origin = [pos.left, pos.top],
        field_of_vision = [
          origin,
          projected_point(origin, this.direction, this.range),
          projected_point(origin, ((this.side === 'left') ? rotate_left(this.direction, 1) : rotate_right(this.direction, 1)), this.range)
        ],
        doc = $(document);
    // do any of the screen edges intersect with the field_of_vision?
    
    for (var i in field_of_vision) {
      var p = field_of_vision[i];
      if (p[0] < 0 || p[0] > doc.width()) return true;
      if (p[1] < 0 || p[1] > doc.height()) return true;
    }
    // are any other butterflies in the field of vision?
    
    return false;
  };
  this.go = function() {
    if (this.see) {
      // console.log("butterfly " + this.butterfly.id + "can see the edge.", this.butterfly);
      if (this.speed > 0) this.butterfly.urges['decelerate'].excite();
      if (this.side === 'left') this.butterfly.urges['turn-right'].excite()
      else  this.butterfly.urges['turn-left'].excite();
    } else {
      this.butterfly.urges['accelerate'].excite();
      this.butterfly.urges['move'].excite();
    }
    this.butterfly.urges['move'].excite();
  }
}

function Butterfly() {
  this.id = BUTTERFLIES.length;
  BUTTERFLIES.push(this);
  this.direction = randomInt(8) - 1; // facing top.
  this.speed = 10;     // stationary
  this.container = $('<div id="butterfly_' + this.id +
    '" style="padding:0; margin:0; position: absolute; height: 123px; width: 123px; top:' + 
    (randomInt($(document).height() - 153) + 20) + 'px; left: ' + 
    (randomInt($(document).width() - 153) + 20)+ 'px; background-image: url(images/butterfly' +
    this.direction + '.gif);"></div>');
  $("body").append(this.container);
  this.last_update = new Date();
  this.position = function() {
    return this.container.position();
  }
  this.senses = {
    left_eye: new EyeSense(this, 'left'),
    right_eye: new EyeSense(this, 'right')
  };
  this.urges = {
    'move': new MoveUrge(this),
    'turn-left': new TurnLeftUrge(this),
    'turn-right': new TurnRightUrge(this),
    'accelerate': new AccelerateUrge(this),
    'decelerate': new DecelerateUrge(this)
    
  };
  this.move = function() {
    if (this.speed === 0) return;                                     // no movement.
    var alpha = (this.direction + Math.random() - 0.5) * Math.PI / 4, // radians.
        update_time = new Date(),
        t = Math.abs(update_time - this.last_update) / 1000,          // seconds.
        distance = t * this.speed,
        distance_x = distance * Math.sin(alpha),
        distance_y = -distance * Math.cos(alpha),
        offset = this.container.offset();
    this.container.offset({
      top: offset.top + distance_y,
      left: offset.left + distance_x
    });
    this.last_update = update_time;
  };
  this.turn_left = function() {
    if (this.direction === 0) this.direction = 7
    else this.direction--;
    this.container.css('background-image', 'url(images/butterfly' + this.direction + '.gif)');
  };
  this.turn_right = function() {
    if (this.direction === 7) this.direction = 0
    else this.direction++
    this.container.css('background-image', 'url(images/butterfly' + this.direction + '.gif)');
  };
  this.accelerate = function() {
    this.speed++;          // no max speed?
  };
  this.decelerate = function() {
    if (this.speed > 0) this.speed--;
  };
  this.go = function() {
    // console.log("performing lifecycle actions for butterfly " + this.id, this);
    this.senses.left_eye.go();
    this.senses.right_eye.go();
  }
}

function lifecycle() {
  for (var i in BUTTERFLIES) {
    BUTTERFLIES[i].go();
  }
  setTimeout(lifecycle, 100);
}

$(document).ready(function() {
  for (var i = 0; i < BUTTERFLY_MAX; i++) {
    a_butterfly = new Butterfly();
  }
  lifecycle();
  
  // tests
  // for (var i = 0; i < 8; i++) {
  //   console.log('pp['+i+'] = ', projected_point([500,500], i, 200));
  // }
});
