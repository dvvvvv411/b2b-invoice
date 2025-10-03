-- Delete all existing autos
DELETE FROM autos WHERE user_id = '364d382b-2080-4458-84e9-ddf950b8c2e9';

-- Insert the 3 new autos
INSERT INTO autos (user_id, marke, modell, fahrgestell_nr, dekra_bericht_nr, erstzulassung, kilometer, einzelpreis_netto)
VALUES 
  (
    '364d382b-2080-4458-84e9-ddf950b8c2e9',
    'Mercedes-Benz',
    'Vito 114 CDI 4x4 kompakt (160)',
    'WDF44760113422021',
    '3419',
    '2018-03-01',
    57860,
    6300.00
  ),
  (
    '364d382b-2080-4458-84e9-ddf950b8c2e9',
    'Volkswagen',
    'T6.1 2.0 TDI California Beach',
    'WV2ZZZ7HZLH071498',
    '5026',
    '2020-07-01',
    134889,
    5982.90
  ),
  (
    '364d382b-2080-4458-84e9-ddf950b8c2e9',
    'Audi',
    'A4 40 TDI Avant sport',
    'WAUZZZF43KA110983',
    '4882',
    '2019-08-01',
    79255,
    9310.00
  );