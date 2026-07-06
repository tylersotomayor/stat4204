TEX = pdflatex -interaction=nonstopmode
LECTURES = $(basename $(wildcard lecture-*.tex))

.PHONY: all book lectures clean

all: book lectures

book:
	$(TEX) main-class.tex
	makeindex main-class.idx
	$(TEX) main-class.tex
	$(TEX) main-class.tex

lectures:
	@for lecture in $(LECTURES); do \
		$(TEX) $$lecture.tex; \
		$(TEX) $$lecture.tex; \
	done

clean:
	rm -f *.aux *.log *.out *.toc *.loo *.idx *.ind *.ilg *.fls *.fdb_latexmk *.synctex.gz *.pdf
