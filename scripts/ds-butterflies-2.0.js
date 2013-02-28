var BUTTERFLIES = [],
    BUTTERFLY_MAX = 10,
    a_butterfly = null,
    MOUSE = {top: -1, left: -1};

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

function side_of_line(point, line) {
  if (point.left === -1 && point.top === -1) return '';
  var x = point.left,
      y = point.top,
      lax = line[0][0],
      lay = line[0][1],
      lbx = line[1][0],
      lby = line[1][1],
      // result = ((lbx - lax)*(y - lay) - (lby - lay)*(x - lax));
      result = ((lbx - lax)*(lay - y) - (lay - lby)*(x - lax));

  // console.log("testing mouse location.", point, line, result);
  // console.log("testing mouse location.", x, y, lax, lay, lbx, lby);

  if (result > 0) return 'left'
  else if (result < 0) return 'right'
  else return '';
}

function rotate_left(direction, count) {
  var result = direction - count;
  if (result < 0) result += 7;
  return result;
}

function rotate_right(direction, count) {
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
  };
  this.depress= function() {
    this.energy = 0;
    this.threshold = 0;
  };
  this.idle = function() {
    if ((randomInt(this.threshold) < (this.threshold - this.energy)) && this.threshold > 0) this.threshold--
  };
  this.action = function() {};
  this.go = function() {
    if (this.fire()) {
      // console.log('urge fired for', this);
      this.depress();
      this.action();
    } else this.idle();
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
  var $this = this;
  this.butterfly = butterfly;
  this.side = side;
  this.range = 200;         // 200px.
  this.repel = {
    parent: $this,
    test: function() {
      var self = this.parent,
          pos = self.butterfly.position(),
          alpha = self.butterfly.direction * Math.PI / 4,
          origin = [pos.left + (123/2), pos.top + (123/2)],
          field_of_vision = [
            projected_point(origin, self.butterfly.direction, self.range),
            projected_point(origin, ((self.side === 'left') ? rotate_left(self.butterfly.direction, 1) : rotate_right(self.butterfly.direction, 1)), self.range)
          ],
          win = $(window);
      // do any of the screen edges intersect with the field_of_vision?
      // console.log('repel sense for ' + self.side + ' being tested.', self, field_of_vision);
      for (var i in field_of_vision) {
        var p = field_of_vision[i];
        if (p[0] < 0 || p[0] > win.width()) return true;
        if (p[1] < 0 || p[1] > win.height()) return true;
        for (var b in BUTTERFLIES) {
          if (!this.id === b) {
            if (BUTTERFLIES[b].contains({top: p[0], left: p[1]})) return true;
          }
        }
      }
    
      return false;
    },
    pro: function() {
      var self = this.parent;
      if (self.butterfly.speed > 0) self.butterfly.urges['decelerate'].excite();
      if (self.side === 'left') self.butterfly.urges['turn-right'].excite()
      else  self.butterfly.urges['turn-left'].excite();
      // console.log('repel sense for ' + self.side + ' triggered.', self);
    },
    anti: function() {
      var self = this.parent;
      self.butterfly.urges['accelerate'].excite();
      self.butterfly.urges['move'].excite();
    }
  };
  this.attract = {
    parent: $this,
    test: function() {
      var self = this.parent,
          pos = self.butterfly.position(),
          alpha = self.butterfly.direction * Math.PI / 4,
          origin = [pos.left + (123/2), pos.top + (123/2)],
          line_of_sight = [
            origin,
            projected_point(origin, self.butterfly.direction, self.range)
          ],
          tangent = [
            origin,
            projected_point(origin, rotate_left(self.butterfly.direction, 2), self.range)
          ],
          mouse_side = side_of_line(MOUSE, line_of_sight),
          mouse_facing = (side_of_line(MOUSE, tangent) === 'left' ? 'front' : 'back'),
          result = (self.side === mouse_side && mouse_facing === 'front');
      // console.log('mouse is to the ' + mouse_side + ' and ' + mouse_facing + 
      //            ' of butterfly', MOUSE, {pos: self.butterfly.position(), dir: self.butterfly.direction});
      return result;
    },
    pro: function() {
      var self = this.parent;
      // console.log('mouse is ' + self.side + ' of butterfly.', self.butterfly.urges['turn-' + self.side]);
      self.butterfly.urges['turn-' + self.side].excite();
      self.butterfly.urges['accelerate'].excite();
    },
    anti: function() {
      var self = this.parent;
      if (self.butterfly.speed > 0) self.butterfly.urges['decelerate'].excite();
    }
  };
  this.go = function() {
    if (this.repel.test()) this.repel.pro()
    else this.repel.anti();
    if (this.attract.test()) this.attract.pro()
    else this.attract.anti();
    this.butterfly.urges['move'].excite();
  }
}

function Butterfly() {
  this.id = BUTTERFLIES.length;
  BUTTERFLIES.push(this);
  this.direction = randomInt(8) - 1; // facing top.
  this.speed = 50;     // stationary
  this.health = 100;
  this.container = $('<div id="butterfly_' + this.id +
    '" style="padding:0; margin:0; position: absolute; height: 123px; width: 123px; top:' + 
    (randomInt($(window).height() - 153) + 20) + 'px; left: ' + 
    (randomInt($(window).width() - 153) + 20)+ 'px; background-image: url(images/butterfly' +
    this.direction + '.gif);"></div>');
  $("body").append(this.container);
  this.last_update = new Date();
  this.position = function() {
    return this.container.position();
  };
  this.die = function() {
    // kill this butterfly.
    // console.log('butterfly ' + this.id + ' has died.');
    BUTTERFLIES.splice(this.id, 1);
    for (var i in BUTTERFLIES) {
      BUTTERFLIES[i].id = i;  // re-map the ids to the array index.
    }
    this.container.hide();
    this.container.remove();
    delete this.container;
    delete this;
  };
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
        offset = this.container.offset(),
        new_pos = {
          top: offset.top + distance_y,
          left: offset.left + distance_x
        };
    if (this.no_collisions(new_pos)) {
      this.container.offset(new_pos);
    } else {
      // console.log('butterfly[' + this.id + '] (health = ' + this.health + ' says "Ouch!"');
      this.health--;
    }
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
    // check health
    if (this.health < 0) {
      this.die();
    } else {
      if (randomInt(2) === 1) {
        this.senses.left_eye.go();
        this.senses.right_eye.go();
      } else {
        this.senses.right_eye.go();
        this.senses.left_eye.go();
      }
      // now run each urge in a random order.
      var urges = Object.keys(this.urges),
          urge = null, urge_name = null, urge_index = 0;
      while (urges.length > 0) {
        urge_index = randomInt(urges.length) - 1;
        urge_name = urges[urge_index];
        urge = this.urges[urge_name];
        // console.log('running urge[' + urge_index + '] (' + urge_name + ')', urge);
        urge.go();
        urges.splice(urge_index,1);
      }
    }
  };
  this.contains = function(position) {
    var my_pos = this.position(),
        top = my_pos.top,
        bottom = top + 123,
        left = my_pos.left,
        right = left + 123,
        x = position.left,
        y = position.top;
    if (x > left && x < right && y > top && y < bottom) return true
    else return false;
  };
  this.no_collisions = function(new_pos) {
    var x = new_pos.left,
        y = new_pos.top,
        win = $(window);
        max_x = win.width() - 123,
        max_y = win.height() - 123;
    // console.log('x = ' + x + '/' + max_x + ', y = ' + y + '/'+ max_y); 
    // check page edges.
    if (x < 0 || x > max_x || y < 0 || y > max_y) return false;
  
    for (var b in BUTTERFLIES) {
      if (!this.id === b) {
        if (BUTTERFLIES[b].contains(new_pos)) return false;
      }
    }
    return true;
  }
}

function lifecycle() {
  if (BUTTERFLIES.length < BUTTERFLY_MAX && randomInt(BUTTERFLY_MAX) > BUTTERFLIES.length) {
    a_butterfly = new Butterfly();
  }
  for (var i in BUTTERFLIES) {
    BUTTERFLIES[i].go();
  }
  setTimeout(lifecycle, 20);
}

$(document).ready(function() {
  $("body").css({
    'cursor': "none",
    'background': 'url(images/starfield' + (window.devicePixelRatio > 1 ? '@2x' : '') + '.jpg) no-repeat center center fixed',
    'background-size': 'cover',
    'overflow': 'hidden'
  }).append($('<div id="light" style="position:absolute; width: 100px; height: 100px; top: 0px; left: 0px; background-image:url(images/light' +
                (window.devicePixelRatio > 1 ? '@2x' : '') + '.png); background-position: center; background-repeat: no-repeat"></div>'));

  $(document).mousemove(function(event) {
    MOUSE = {left: event.pageX, top: event.pageY};
    $("#light").css({
      top: event.pageY - 50,
      left: event.pageX - 50
    });
  });

  lifecycle();
  
  /* 
  // test side_of_line method.
  var mouse = {top: 500, left: 500},
      origin = [510, 510],
      axis = projected_point(origin, 0, 200),
      tangent = projected_point(origin, 2, 200),
      side = side_of_line(mouse, [origin, axis]),
      facing = side_of_line(mouse, [origin, tangent]) === 'left' ? 'front' : 'back';
  
  console.assert(facing === 'front', "expected facing to be 'front' but it's '" + facing + "'.")
  console.assert(side === 'left', "expected mouse to be to the left of origin but it's to the " + side)
  */
  
});
