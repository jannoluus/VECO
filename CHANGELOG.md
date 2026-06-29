# VECO_RC1.005.3

- Parandatud concurrent edit overwrite: tehniku avatud detailvaade ei kirjuta enam admini probleemi kirjelduse muudatusi üle.
- Lisatud patchLocalWorkorderFields / patchWorkorderFields.
- Tehniku autosave, Alusta/Paus/Jätka/Töö valmis kasutavad kitsast field-patchi.
- Ei muudetud PDF-i, kalendrit ega üldist töövoogu.

Ristkontroll:
- JS syntax OK.
- Regression check OK.
- Tehniku autosave ja olekunupud kasutavad patchWorkorderFields().
- Akti loomine localOnly režiimis kasutab värsket localStorage state'i, mitte vana modali koopiat.
