// Broadsheet title-block injector—masthead, edition line, seal, byline,
// speaker notes, and floating pull-quote. Customize the marked sections
// for each talk; leave the structural scaffolding intact.

(function () {
  // ============================================================
  // CUSTOMIZE PER TALK—title-block content
  // ============================================================
  // The QR plate links to the published predecessor in JACT until the shadow
  // paper is on the arXiv; then swap the URL, the QR and the caption in
  // theme.scss (.qr-plate::after). See README.
  var ARXIV_URL = 'https://doi.org/10.1007/s41468-026-00242-2';

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
    '<p>Three results, all in every ambient dimension. A combinatorial condition on a flag complex, the apex condition, under which the shadow projection is a homotopy equivalence. For a sample on the graph, at one scale, the shadow is a geometric reconstruction: homotopy equivalent to the graph and Hausdorff-close to it. For a sample merely near a polygonal graph, the shadow projection is injective on every homotopy group.</p>';

  // QR of the JACT paper, doi:10.1007/s41468-026-00242-2 (generated with the
  // Python package qrcode, error correction M).
  var JACT_QR_SVG = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" class="qr-code" role="img" aria-label="QR code: the JACT paper"><g transform="translate(60,60) scale(16.55172)"><path d="M0 0h7v1h-7zM8 0h3v1h-3zM13 0h1v1h-1zM15 0h1v1h-1zM20 0h1v1h-1zM22 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM11 1h1v1h-1zM13 1h2v1h-2zM17 1h1v1h-1zM19 1h2v1h-2zM22 1h1v1h-1zM28 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM10 2h1v1h-1zM12 2h1v1h-1zM15 2h4v1h-4zM22 2h1v1h-1zM24 2h3v1h-3zM28 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h1v1h-1zM10 3h4v1h-4zM15 3h1v1h-1zM20 3h1v1h-1zM22 3h1v1h-1zM24 3h3v1h-3zM28 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM8 4h3v1h-3zM13 4h1v1h-1zM15 4h1v1h-1zM17 4h2v1h-2zM20 4h1v1h-1zM22 4h1v1h-1zM24 4h3v1h-3zM28 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM8 5h1v1h-1zM10 5h1v1h-1zM14 5h1v1h-1zM16 5h2v1h-2zM19 5h2v1h-2zM22 5h1v1h-1zM28 5h1v1h-1zM0 6h7v1h-7zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h7v1h-7zM8 7h1v1h-1zM10 7h1v1h-1zM15 7h1v1h-1zM17 7h2v1h-2zM0 8h1v1h-1zM4 8h1v1h-1zM6 8h3v1h-3zM10 8h1v1h-1zM14 8h2v1h-2zM17 8h1v1h-1zM19 8h1v1h-1zM21 8h5v1h-5zM28 8h1v1h-1zM3 9h1v1h-1zM5 9h1v1h-1zM7 9h2v1h-2zM10 9h1v1h-1zM12 9h2v1h-2zM15 9h1v1h-1zM20 9h1v1h-1zM22 9h7v1h-7zM2 10h1v1h-1zM4 10h1v1h-1zM6 10h2v1h-2zM14 10h3v1h-3zM20 10h1v1h-1zM23 10h2v1h-2zM28 10h1v1h-1zM2 11h2v1h-2zM5 11h1v1h-1zM7 11h1v1h-1zM9 11h1v1h-1zM17 11h2v1h-2zM24 11h2v1h-2zM27 11h2v1h-2zM0 12h1v1h-1zM2 12h9v1h-9zM12 12h1v1h-1zM14 12h1v1h-1zM16 12h4v1h-4zM21 12h1v1h-1zM27 12h1v1h-1zM0 13h1v1h-1zM3 13h1v1h-1zM10 13h1v1h-1zM13 13h1v1h-1zM15 13h1v1h-1zM20 13h3v1h-3zM24 13h5v1h-5zM0 14h2v1h-2zM4 14h1v1h-1zM6 14h1v1h-1zM9 14h1v1h-1zM12 14h2v1h-2zM15 14h4v1h-4zM21 14h2v1h-2zM25 14h2v1h-2zM28 14h1v1h-1zM0 15h2v1h-2zM5 15h1v1h-1zM11 15h2v1h-2zM16 15h2v1h-2zM19 15h3v1h-3zM23 15h2v1h-2zM27 15h2v1h-2zM5 16h2v1h-2zM8 16h2v1h-2zM14 16h1v1h-1zM16 16h3v1h-3zM20 16h2v1h-2zM27 16h1v1h-1zM0 17h2v1h-2zM3 17h3v1h-3zM7 17h1v1h-1zM10 17h3v1h-3zM14 17h2v1h-2zM20 17h1v1h-1zM22 17h4v1h-4zM27 17h2v1h-2zM2 18h1v1h-1zM4 18h4v1h-4zM10 18h1v1h-1zM14 18h4v1h-4zM22 18h1v1h-1zM24 18h1v1h-1zM26 18h1v1h-1zM28 18h1v1h-1zM5 19h1v1h-1zM11 19h1v1h-1zM14 19h5v1h-5zM24 19h1v1h-1zM27 19h2v1h-2zM0 20h2v1h-2zM3 20h2v1h-2zM6 20h1v1h-1zM9 20h1v1h-1zM11 20h1v1h-1zM14 20h1v1h-1zM16 20h10v1h-10zM28 20h1v1h-1zM8 21h1v1h-1zM10 21h1v1h-1zM12 21h2v1h-2zM15 21h1v1h-1zM20 21h1v1h-1zM24 21h1v1h-1zM28 21h1v1h-1zM0 22h7v1h-7zM8 22h1v1h-1zM11 22h3v1h-3zM15 22h1v1h-1zM17 22h4v1h-4zM22 22h1v1h-1zM24 22h3v1h-3zM28 22h1v1h-1zM0 23h1v1h-1zM6 23h1v1h-1zM9 23h3v1h-3zM15 23h1v1h-1zM17 23h1v1h-1zM20 23h1v1h-1zM24 23h1v1h-1zM27 23h1v1h-1zM0 24h1v1h-1zM2 24h3v1h-3zM6 24h1v1h-1zM8 24h1v1h-1zM10 24h6v1h-6zM17 24h9v1h-9zM28 24h1v1h-1zM0 25h1v1h-1zM2 25h3v1h-3zM6 25h1v1h-1zM9 25h7v1h-7zM20 25h1v1h-1zM28 25h1v1h-1zM0 26h1v1h-1zM2 26h3v1h-3zM6 26h1v1h-1zM10 26h3v1h-3zM14 26h3v1h-3zM18 26h1v1h-1zM21 26h1v1h-1zM25 26h4v1h-4zM0 27h1v1h-1zM6 27h1v1h-1zM9 27h2v1h-2zM14 27h4v1h-4zM19 27h2v1h-2zM23 27h1v1h-1zM25 27h1v1h-1zM27 27h2v1h-2zM0 28h7v1h-7zM8 28h1v1h-1zM10 28h2v1h-2zM13 28h13v1h-13zM27 28h1v1h-1z" fill="currentColor" shape-rendering="crispEdges"/></g></svg>';

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
  var LEFT_PLATE_SVG  = '<img src="assets/title-plate.svg?v=202610012219" alt="">';
  var RIGHT_PLATE_SVG = JACT_QR_SVG;

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
