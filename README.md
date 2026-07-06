# Notes in Statistical Inference — STAT S4204

Student lecture notes for **STAT S4204, Statistical Inference** (Columbia University,
Summer 2026, Session B), based on the lectures of Daniel Rabinowitz. Notes by Tyler
Sotomayor.

**Live site:** https://tylersotomayor.github.io/stat4204/

## What's published here

- `lecture-NN.pdf` — standalone lecture notes, one per lecture.
- `notes-in-statistical-inference.pdf` — the complete class edition (all lectures,
  problem sets, the course list of facts, and the index of objects), once assignments
  in it are past due.
- `assignment-N.pdf` — problem-set write-ups with worked solutions and reflections,
  published only **after** each assignment's due date.
- `src/` — the LaTeX source of the class edition (house style `inferencenotes.sty`,
  one subfile per lecture).

Exam material is intentionally not included in this public edition; the full source
(with exams and instructor-provided materials) lives in a separate private repository.

## Building from source

`src/` requires TeX Live/MacTeX (`pdflatex` + `makeindex`):

```sh
cd src
make book       # the complete class edition
make lectures   # standalone lecture PDFs
```

## Errata

tyler.sotomayor@columbia.edu
