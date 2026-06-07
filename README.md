# VECO V3

Versioon: v3.11.12
Build: 20260607_1820

Muudatused:
- Töökäsu staatuse töövoog: Planeeritud / Töös / Lõpetatud.
- Lõpetamisel VECO enda kinnitusküsimus.
- Lõpetatud töö jääb kalendrisse ja admini vaadetesse, kuid peidetakse tehniku aktiivsest vaatest.
- Lõpetatud tööle salvestatakse completed_at ja completed_by, kui Supabase veerud on olemas.
- Kalendris on staatuse järgi pehmed värvieristused.

Supabase lisaveerud:
```sql
alter table workorders
add column if not exists completed_at timestamptz,
add column if not exists completed_by text;
```
