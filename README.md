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

## When the preprint is posted

The arXiv QR on the title slide is a placeholder. Once the ID exists:

1. set `ARXIV_URL` in `assets/inject-landmark.js`;
2. replace `QR_PLACEHOLDER_SVG` there with a real code, e.g.

   ```bash
   python3 -c "import qrcode, qrcode.image.svg as s; \
   qrcode.make('https://arxiv.org/abs/XXXX.XXXXX', image_factory=s.SvgPathImage).save('qr.svg')"
   ```

   and paste its `<svg>` with `class="qr-code"`;
3. change the caption in `theme.scss` (`.qr-plate::after`) and the contact
   line on the last slide.
