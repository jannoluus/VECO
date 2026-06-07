# VECO V3

Versioon: v3.11.13
Build: 20260607_1907

Muudatused:
- Töökäsu staatuse töövoog: Planeeritud / Töös / Lõpetatud.
- Lõpetamisel VECO enda kinnitusküsimus.
- Lõpetatud töö jääb kalendrisse ja admini vaadetesse, kuid peidetakse tehniku aktiivsest vaatest.
- Lõpetatud tööle salvestatakse completed_at ja completed_by, kui Supabase veerud on olemas.
- Kalendri vaikimisi filter näitab ka lõpetatud töid, et need ei kaoks planeerimisvaatest.
- Tehniku vaade peidab lõpetatud tööd endiselt aktiivsest nimekirjast.
- Kalendris on staatuse järgi pehmed värvieristused.

Supabase lisaveerud:
```sql
alter table workorders
add column if not exists completed_at timestamptz,
add column if not exists completed_by text;
```


## V3.11.9.5 / 20260607_1915
- Supabase sync järjekord: kiire järjestikune salvestamine ei jää enam syncing-luku taha.
- Realtime kõrvale lisatud 5 s turvapolling, et telefoni/admini vaated uueneksid ka juhul, kui brauser realtime sündmuse maha magab.
