VECO_V3_20260621_1734

CR-DATA-001/002 patch build.
- Base: VECO_V3_20260619_1718.
- Lisatud klientide ja objektide Supabase sünkroon.
- Töökäsu loomisel sisestatud uus klient ei jää enam ainult lokaalseks.
- Tehniku vaade saab kliendi/objekti info Supabase'ist, kui SUPABASE_CLIENTS_OBJECTS.sql on käivitatud.
- Diagnostikas on nähtav klientide arv ja masterdata sync vea rida.

Enne kasutamist käivita vajadusel Supabase SQL editoris:
SUPABASE_CLIENTS_OBJECTS.sql
