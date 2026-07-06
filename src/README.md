# Source — Notes in Statistical Inference (class edition)

LaTeX source for the class edition of the STAT S4204 notes. `main-class.tex` is the
build root (it inputs `main.tex`); `inferencenotes.sty` is the house style; each
lecture is a `subfiles` document that also compiles standalone.

Requires TeX Live / MacTeX (`pdflatex` + `makeindex`):

```sh
make          # the complete class edition (main-class.pdf) + each lecture
make book     # just the class edition
make lectures # just the standalone lecture PDFs
```

A single lecture builds standalone with `pdflatex lecture-01.tex` (three passes to
resolve the contents and the per-lecture index of objects).

Assignments join this tree only after their due dates; exam material is intentionally
not included in this public edition. The full source (with exams and instructor
materials) lives in a separate private repository.
