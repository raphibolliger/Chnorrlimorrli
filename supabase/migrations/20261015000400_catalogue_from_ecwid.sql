with inserted as (
  insert into public.products (
    slug, sku, name, short_description, description, price_rappen, active, sort_order, track_stock, stock
  )
  values
    (
      'chnorrlimorrli-2-und-die-koenige-des-freiamts',
      '00002',
      'Chnorrlimorrli 2 – und die Könige des Freiamts',
      'Das zweite Buch: die neuen Abenteuer von Chnorrlimorrli.',
      'Die neuen Abenteuer von Chnorrlimorrli. Die zweite Geschichte spielt an zehn verschiedenen Orten im Freiamt, die man alle auf eigene Faust besuchen kann.',
      4000,
      true,
      1,
      false,
      null
    ),
    (
      'chnorrlimorrli-1-das-buch-2021',
      '00000',
      'Chnorrlimorrli 1 – das Buch 2021',
      'Das erste Buch: eine abenteuerliche Reise durch das Freiamt.',
      'Eine abenteuerliche Reise durch das Freiamt. Chnorrlimorrli hat an sieben verschiedenen Orten jeweils eine Mission zu erfüllen.',
      4000,
      true,
      2,
      true,
      147
    ),
    (
      'chnorrlimorrli-socken',
      '00004',
      'Chnorrlimorrli-Socken',
      'Für kleine und grosse Chnorrlimorrli-Fans.',
      'Hochwertige Chnorrlimorrli-Socken eines befreundeten Unternehmens aus Georgien (weil es dort an vielen Dingen fehlt).',
      1000,
      true,
      3,
      false,
      null
    ),
    (
      'freiaemter-chnorrlimorrli-socken',
      '00003',
      'Freiämter Chnorrlimorrli-Socken',
      'Gelb-blaue Socken, deren Gewinn in den Nachwuchs der Freiämter Ringer fliesst.',
      'Man kann nie genug Socken haben. Ob Geburtstag oder Weihnachten: Socken als Geschenk gehen immer. Und ab sofort kann jeder Chnorrlimorrli-Fan original Freiämter Socken bestellen. Unterschiedliche Grössen sind vorhanden. Sie sind gelb und blau (siehe Bild).

Die Ringerstaffel Freiamt trägt solche Socken schon länger. Der Verein übernimmt auch die Herstellung (die Socken werden selbst gefärbt) – und der ganze Gewinn dieses Chnorrlimorrli-Fan-Artikels fliesst in den Nachwuchs der Freiämter Ringer.',
      1000,
      false,
      4,
      false,
      null
    )
  returning id, slug
),
images as (
  insert into public.product_images (product_id, storage_path, alt, sort_order)
  select inserted.id, image.storage_path, image.alt, image.sort_order
  from inserted
  join (
    values
      ('chnorrlimorrli-2-und-die-koenige-des-freiamts', 'seed/chnorrlimorrli-2-1.webp', 'Buchcover «Chnorrlimorrli und die Könige des Freiamts»', 0),
      ('chnorrlimorrli-1-das-buch-2021', 'seed/chnorrlimorrli-1-1.webp', 'Buchcover des ersten Chnorrlimorrli-Buchs', 0),
      ('chnorrlimorrli-1-das-buch-2021', 'seed/chnorrlimorrli-1-2.webp', 'Rückseite des ersten Chnorrlimorrli-Buchs', 1),
      ('chnorrlimorrli-socken', 'seed/chnorrlimorrli-socken-1.webp', 'Chnorrlimorrli-Socken für Kinder und Erwachsene', 0),
      ('chnorrlimorrli-socken', 'seed/chnorrlimorrli-socken-2.webp', 'Chnorrlimorrli-Socke in Blau', 1),
      ('chnorrlimorrli-socken', 'seed/chnorrlimorrli-socken-3.webp', 'Etikett der Chnorrlimorrli-Socken', 2)
  ) as image (slug, storage_path, alt, sort_order) on image.slug = inserted.slug
  returning 1
)
insert into public.product_options (product_id, name, choices, sort_order)
select inserted.id, option.name, option.choices, 0
from inserted
join (
  values
    ('chnorrlimorrli-socken', 'Grösse', array['31-35', '39-46']),
    ('freiaemter-chnorrlimorrli-socken', 'Grösse', array['31/33', '34/36', '37/39', '40/42', '43/45'])
) as option (slug, name, choices) on option.slug = inserted.slug;

with methods as (
  insert into public.shipping_methods (kind, name, description, active, sort_order, postal_codes, pickup_location, pickup_hours)
  values
    (
      'pickup',
      'Selbstabholung',
      'Abholung beim Verein Chnorrlimorrli in Villmergen. Wir melden uns per E-Mail, sobald die Bestellung bereitliegt.',
      true,
      1,
      '{}',
      'Verein Chnorrlimorrli, 5612 Villmergen',
      'Nach Absprache via E-Mail oder Telefon'
    ),
    (
      'postal',
      'Postversand',
      'Versand mit der Schweizerischen Post innerhalb der Schweiz.',
      true,
      2,
      '{}',
      null,
      null
    ),
    (
      'local_delivery',
      'Lieferung im Freiamt',
      'Hauslieferdienst durch den Verein Chnorrlimorrli (Lieferung innerhalb einer Woche).',
      true,
      3,
      array[
        '5445', '5504', '5522', '5524', '5525', '5600', '5603', '5604', '5605', '5606', '5607',
        '5610', '5611', '5612', '5613', '5614', '5615', '5616', '5617', '5618', '5619', '5620',
        '5621', '5622', '5623', '5624', '5625', '5626', '5627', '5628', '5630', '5632', '5634',
        '5636', '5637', '5642', '5643', '5644', '5645', '5646', '5647', '5704', '5707', '6042',
        '8905', '8916', '8917', '8918', '8919', '8964', '8965', '8966', '8967'
      ],
      null,
      null
    )
  returning id, kind
)
insert into public.shipping_rates (shipping_method_id, from_subtotal_rappen, price_rappen)
select methods.id, rate.from_subtotal_rappen, rate.price_rappen
from methods
join (
  values
    ('pickup'::public.shipping_kind, 0, 0),
    ('postal'::public.shipping_kind, 0, 0),
    ('postal'::public.shipping_kind, 1001, 1000),
    ('local_delivery'::public.shipping_kind, 0, 500)
) as rate (kind, from_subtotal_rappen, price_rappen) on rate.kind = methods.kind;
