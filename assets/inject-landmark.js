// Broadsheet title-block injector—masthead, edition line, seal, byline,
// speaker notes, and floating pull-quote. Customize the marked sections
// for each talk; leave the structural scaffolding intact.

(function () {
  // ============================================================
  // CUSTOMIZE PER TALK—title-block content
  // ============================================================
  // Empty until the preprint is posted: the QR plate is then a placeholder and
  // not a link. When the ID exists, set it here, regenerate the QR
  // (see README), and update the caption in theme.scss (.qr-plate::after).
  var ARXIV_URL = '';

  // Eyebrow/kicker shown above the (long, registered) title—the human hook.
  // Empty string disables it.
  var KICKER = '';

  var GAZETTE = {
    volume:   'Vol. I',
    issue:    'No. V',
    name:     'The Topology Gazette',
    edition:  'Washington Edition',
  };

  var COAUTHORS = [
    'Kazuhiro Kawamura',
    'Atish Mitra',
  ];

  var EDITION_LINE = {
    field:    'Applied Topology · Geometric Reconstruction',
    venue:    { text: 'AMS Fall Eastern Sectional · Special Session on Advances in Applied Topology',
                href: 'https://meetings.ams.org/math/fall2026e/meetingapp.cgi/Paper/64011' },
  };

  var PULLQUOTE = {
    body:    'The Euclidean obstruction is a theorem about the Euclidean metric. Change the metric and the plane stops being special.',
    attrib:  'a dispatch on shadows',
  };

  // Speaker notes for the title slide (HTML; presenter-only).
  // Inline `::: {.notes}` at the top of the .qmd would create a phantom
  // empty slide, so we inject the title's notes here instead.
  var TITLE_NOTES_HTML =
    '<p>Thank you, and thanks to Atish, Jacob and Abigail for the session. This is joint work with Kazuhiro Kawamura and Atish Mitra.</p>' +
    '<p>Kazuhiro has just shown how shape theory gets past the Euclidean obstruction for shadows in the limit, as the scale goes to zero. This talk is the finite-sample half of the same question: one sample, explicit scales, embedded graphs in any ambient dimension.</p>' +
    '<p>Two results. First, from a sample merely Hausdorff-close to the graph, an embedded 1-complex homeomorphic to it, at a single scale. Second, the shadow in every dimension: injective on homotopy groups, and every feature that survives an explicit enlargement of scale is a feature of the graph. The engine is a combinatorial condition, the apex condition, under which the shadow projection of a flag complex is a homotopy equivalence in every dimension.</p>';

  // Placeholder QR: finder patterns and a caption, no data modules. Swap for
  // a real QR of ARXIV_URL once the preprint is posted.
  var QR_PLACEHOLDER_SVG =
    '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" class="qr-code qr-placeholder" role="img" aria-label="QR code placeholder">' +
      '<g fill="none" stroke="currentColor" stroke-width="28">' +
        '<rect x="74" y="74" width="140" height="140"/><rect x="386" y="74" width="140" height="140"/><rect x="74" y="386" width="140" height="140"/>' +
      '</g>' +
      '<g fill="currentColor"><rect x="116" y="116" width="56" height="56"/><rect x="428" y="116" width="56" height="56"/><rect x="116" y="428" width="56" height="56"/></g>' +
      '<g fill="currentColor" opacity="0.18"><rect x="260" y="74" width="28" height="28"/><rect x="316" y="102" width="28" height="28"/><rect x="260" y="158" width="28" height="28"/><rect x="316" y="214" width="28" height="28"/>' +
        '<rect x="74" y="260" width="28" height="28"/><rect x="158" y="316" width="28" height="28"/><rect x="214" y="260" width="28" height="28"/><rect x="498" y="316" width="28" height="28"/><rect x="442" y="260" width="28" height="28"/></g>' +
      '<text x="357" y="420" text-anchor="middle" font-family="Alegreya SC, EB Garamond, Georgia, serif" font-size="46" letter-spacing="4" fill="currentColor">arXiv</text>' +
      '<text x="357" y="478" text-anchor="middle" font-family="EB Garamond, Georgia, serif" font-style="italic" font-size="36" fill="currentColor" opacity="0.8">October 2026</text>' +
    '</svg>';

  // ============================================================
  // STRUCTURAL SCAFFOLDING—usually no edits needed below
  // ============================================================

  function makePlate(cls, label, svg, href) {
    var el = href ? document.createElement('a') : document.createElement('figure');
    el.className = cls;
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('data-plate', label);
    if (href) { el.href = href; el.target = '_blank'; el.rel = 'noopener'; }
    el.innerHTML = svg;
    return el;
  }

  function makeEdition(items) {
    var line = document.createElement('div');
    line.className = 'edition-line';
    items.forEach(function (item) {
      if (!item) return;
      var s = document.createElement('span');
      if (typeof item === 'string') {
        s.textContent = item;
      } else {
        var a = document.createElement('a');
        a.href = item.href; a.target = '_blank'; a.rel = 'noopener';
        a.textContent = item.text;
        s.appendChild(a);
      }
      line.appendChild(s);
    });
    return line;
  }

  // Title-block plates: Pl. I is the sampled graph and its shadow; Pl. III
  // is the arXiv QR (a placeholder until the preprint is posted).
  var LEFT_PLATE_SVG  = '<img src="assets/title-plate.svg" alt="">';
  var RIGHT_PLATE_SVG = QR_PLACEHOLDER_SVG;

  // Wax seal—initials inside a serif circle. Customize the textPaths
  // (top/bottom band) and inner monogram for your name.
  var SEAL_SVG =
    '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" class="wax-seal" viewBox="0 0 80 80" role="img" aria-label="Author seal">' +
      '<defs>' +
        '<style>' +
          '.seal-ring { stroke: currentColor; fill: none; stroke-width: 1.3; }' +
          '.seal-inner { stroke: currentColor; fill: none; stroke-width: 0.45; }' +
          '.seal-mark { fill: currentColor; stroke: none; }' +
          '.seal-mono { font-family: "EB Garamond", Georgia, serif; font-weight: 700; font-size: 14px; fill: currentColor; }' +
          '.seal-band { font-family: "Alegreya SC", "EB Garamond", Georgia, serif; font-size: 4.6px; letter-spacing: 0.22em; fill: currentColor; }' +
        '</style>' +
        '<path id="seal-top" d="M 11 40 A 29 29 0 0 1 69 40" />' +
        '<path id="seal-bottom" d="M 11 40 A 29 29 0 0 0 69 40" />' +
      '</defs>' +
      '<circle class="seal-ring" cx="40" cy="40" r="36" />' +
      '<circle class="seal-inner" cx="40" cy="40" r="33" />' +
      '<circle class="seal-inner" cx="40" cy="40" r="22" />' +
      '<text class="seal-band"><textPath href="#seal-top" startOffset="50%" text-anchor="middle">SVSHOVAN MAJHI</textPath></text>' +
      '<text class="seal-band"><textPath href="#seal-bottom" startOffset="50%" text-anchor="middle">· ANNO MMXXVI ·</textPath></text>' +
      // tetrahedral monogram mark (a nod to simplices) + Bengali signature
      '<g>' +
        '<polygon class="seal-mark" opacity="0.16" points="35,33 40,24 40,41" />' +
        '<polygon class="seal-mark" opacity="0.16" points="40,24 45,33 40,41" />' +
        '<g stroke="currentColor" fill="none" stroke-width="0.55">' +
          '<line x1="35" y1="33" x2="40" y2="24" /><line x1="40" y1="24" x2="45" y2="33" />' +
          '<line x1="35" y1="33" x2="40" y2="41" /><line x1="45" y1="33" x2="40" y2="41" />' +
          '<line x1="40" y1="24" x2="40" y2="41" /><line x1="35" y1="33" x2="45" y2="33" />' +
        '</g>' +
      '</g>' +
      '<text class="seal-mono" x="40" y="51" text-anchor="middle" style="font-family: \'Noto Serif Bengali\', \'Bengali Sangam MN\', \'Kalpurush\', serif; font-size: 12px;">সুশোভন</text>' +
    '</svg>';

  function inject() {
    var tb = document.querySelector('.quarto-title-block');
    if (!tb || tb.querySelector('.masthead')) return;

    var titleEl    = tb.querySelector('h1.title');
    var subtitleEl = tb.querySelector('.subtitle');
    var authorEl   = tb.querySelector('.quarto-title-author-name, .author');
    var dateEl     = tb.querySelector('p.date, .date');

    var author = authorEl ? authorEl.textContent.trim() : '';
    var date   = dateEl   ? dateEl.textContent.trim()   : '';

    var volBadge = document.createElement('div');
    volBadge.className = 'edition-badge title-volume';
    volBadge.innerHTML =
      '<span>' + GAZETTE.volume  + '</span>' +
      '<span>' + GAZETTE.issue   + '</span>' +
      '<span>' + GAZETTE.name    + '</span>' +
      '<span>' + GAZETTE.edition + '</span>';

    var seal = document.createElement('div');
    seal.className = 'title-seal';
    seal.setAttribute('aria-hidden', 'true');
    seal.innerHTML = SEAL_SVG;

    var masthead = document.createElement('header');
    masthead.className = 'masthead';

    var row = document.createElement('div');
    row.className = 'masthead-row';

    var left  = makePlate('landmark-plate left',  'I',   LEFT_PLATE_SVG);
    var right = makePlate('landmark-plate right qr-plate', 'III', RIGHT_PLATE_SVG, ARXIV_URL);

    var text = document.createElement('div');
    text.className = 'masthead-text';
    if (KICKER) {
      var kicker = document.createElement('p');
      kicker.className = 'masthead-kicker';
      kicker.textContent = KICKER;
      text.appendChild(kicker);
    }
    if (titleEl)    text.appendChild(titleEl);
    if (subtitleEl) text.appendChild(subtitleEl);

    if (COAUTHORS.length > 0) {
      var byline = document.createElement('p');
      byline.className = 'masthead-byline';
      var names = COAUTHORS.map(function (n) {
        return '<span class="byline-name">' + n + '</span>';
      }).join(' · ');
      byline.innerHTML = '<span class="byline-label">with</span> ' + names;
      text.appendChild(byline);
    }

    row.appendChild(left);
    row.appendChild(text);
    row.appendChild(right);
    masthead.appendChild(row);

    masthead.appendChild(makeEdition([
      author,
      EDITION_LINE.field,
      EDITION_LINE.venue,
      date,
    ]));

    var auths = tb.querySelector('.quarto-title-authors');
    if (auths)  auths.style.display  = 'none';
    if (dateEl) dateEl.style.display = 'none';

    tb.insertBefore(masthead, tb.firstChild);
    tb.insertBefore(volBadge, masthead);
    tb.appendChild(seal);

    var notes = document.createElement('aside');
    notes.className = 'notes';
    notes.innerHTML = TITLE_NOTES_HTML;
    tb.appendChild(notes);

    var quote = document.createElement('aside');
    quote.className = 'title-pullquote';
    quote.innerHTML =
      '<blockquote>' + PULLQUOTE.body + '</blockquote>' +
      '<div class="attribution">' + PULLQUOTE.attrib + '</div>';
    tb.appendChild(quote);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();

// Toggle a "finis" class on .reveal while the colophon slide is showing, so the
// theme can drop the running footer and page number on the back page. Quarto
// strips data-state from headings, so we drive it from Reveal's slide events.
// (Quarto also keeps only the first line of include-after-body `text:`, so extra
// deck JS like this lives appended here rather than as a second <script>.)
(function () {
  function hook() {
    if (typeof Reveal === 'undefined' || !Reveal.on) { setTimeout(hook, 100); return; }
    function update() {
      var cur = Reveal.getCurrentSlide();
      var isColophon = !!(cur && cur.classList && cur.classList.contains('colophon'));
      var r = document.querySelector('.reveal');
      if (r) r.classList.toggle('finis', isColophon);
    }
    Reveal.on('slidechanged', update);
    Reveal.on('ready', update);
    update();
  }
  hook();
})();
