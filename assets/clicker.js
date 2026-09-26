// Make presentation-remote (clicker) keys robust: bind every common
// "advance / go back" key to linear next / prev in reading order.
// keyCodes: 33 PgUp, 34 PgDn, 37 Left, 39 Right, 38 Up, 40 Down, 32 Space, 8 Backspace.
(function () {
  var map = { 33: 'prev', 34: 'next', 37: 'prev', 39: 'next',
              38: 'prev', 40: 'next', 32: 'next', 8: 'prev' };
  function apply() {
    if (window.Reveal && typeof Reveal.configure === 'function') {
      try { Reveal.configure({ keyboard: map }); } catch (e) {}
    } else {
      setTimeout(apply, 150);
    }
  }
  apply();
})();
