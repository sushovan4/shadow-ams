# Beyond a Shadow of a Doubt: Certified Graph Reconstruction in ℝᴺ

Slides for a talk at the AMS Fall Eastern Sectional Meeting, George Washington
University, Washington, D.C., October 3, 2026. Special Session on Advances in
Applied Topology: Theory and Applications, I.

Joint work with Kazuhiro Kawamura and Atish Mitra.

**Slides:** <https://smajhi.com/shadow-ams/>
**Abstract:** <https://meetings.ams.org/math/fall2026e/meetingapp.cgi/Paper/64011>

## Build

```bash
python3 tools/figures.py              # regenerate the figures and section plates
quarto render index.qmd --to revealjs # render to index.html
quarto preview index.qmd              # live preview
quarto publish gh-pages               # deploy to GitHub Pages
```

Every figure showing a sample, a Vietoris–Rips complex or a shadow is computed
by `tools/figures.py` from actual sampled points under the stated metric.

## Caching

smajhi.com sits behind Cloudflare, which caches scripts and images for up to
four hours. After changing `assets/shadow-lab.js` or `assets/title-plate.svg`,
bump the `?v=` stamp on its URL (in `index.qmd` and `assets/inject-landmark.js`
respectively) before `quarto publish`, or the old file keeps being served.

To present offline, run `quarto render index.qmd` and open `index.html`; the
live slides run without a network connection.

## Math environments

The deck states results in amsthm-style boxes defined in `theme.scss`:

```markdown
::: {.theorem data-num="17" data-name="Geometric reconstruction" data-cite="Majhi–Mitra"}
[Hypotheses, set in muted ink.]{.hyp} Conclusion.
:::
```

Kinds: `.theorem`, `.proposition`, `.lemma`, `.corollary`, `.conjecture`
(italic body); `.definition`, `.example`, `.question`, `.problem` (roman body);
`.rmk` for remarks and `.sketch` for proof sketches. (`.remark` and `.proof`
are avoided because Quarto claims those names.) Numbers are set by hand in
`data-num`. Use `.env-row` for two statements side by side and `.fig-row` for a
figure beside statements.

## The QR code

The QR on the title slide links to the planar predecessor,
[doi:10.1007/s41468-026-00242-2](https://doi.org/10.1007/s41468-026-00242-2)
(Komendarczyk, Majhi and Mitra, *Journal of Applied and Computational
Topology*, 2026). When the shadow paper is on the arXiv:

1. set `ARXIV_URL` in `assets/inject-landmark.js`;
2. regenerate the code, e.g.

   ```bash
   python3 -c "import qrcode; q=qrcode.QRCode(border=0); q.add_data('https://arxiv.org/abs/XXXX.XXXXX'); q.make(fit=True); print(len(q.get_matrix()))"
   ```

   and replace the path in `JACT_QR_SVG` (one unit square per dark module,
   as in the current code), keeping `class="qr-code"`;
3. change the caption in `theme.scss` (`.qr-plate::after`) and the contact
   line on the last slide.
