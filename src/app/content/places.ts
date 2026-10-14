import { ExternalLink } from './types';

export interface Place {
  slug: string;
  name: string;
  book: 1 | 2;
  image: string;
  paragraphs: string[];
  link?: ExternalLink;
}

export const places: Place[] = [
  {
    slug: 'hasenbergturm',
    name: 'Hasenbergturm Widen',
    book: 1,
    image: 'orte/hasenbergturm',
    paragraphs: [
      'Der Hasenbergturm wurde 2021 eröffnet und steht auf dem Hasenberg, dem südlichsten Ausläufer der Heitersberg-Hügelkette zwischen Reuss- und Limmattal. Der Turm ist 40 m hoch und hat 210 Treppenstufen. Er bildet den Höhepunkt im Naherholungsgebiet Hasenberg, einem beliebten Ausflugsziel für die ganze Region.',
      'Der Hasenbergturm befindet sich in der Gemeinde Widen, 200 Meter nach der Stiftung Haus Morgenstern. Der Hasenberg bietet weitere Attraktionen: Grillplatz, Sitzbänke und Brunnen beim Aussichtsturm. Cafeteria, Kleintiergarten und Spielplatz für Kinder bei der Stiftung Haus Morgenstern. Panorama-Wanderweg nach Bellikon, einen Waldlehrpfad und natürlich den wunderschönen Egelsee in unmittelbarer Nähe.',
    ],
    link: { label: 'Hasenbergturm', url: 'https://hasenbergturm.ch' },
  },
  {
    slug: 'strohmuseum',
    name: 'Strohmuseum im Park Wohlen',
    book: 1,
    image: 'orte/strohmuseum',
    paragraphs: [
      'Die Villa Isler und ihr Park wurden in den 1860er-Jahren durch den Strohfabrikanten August Isler erbaut. 2013 wurde darin das Strohmuseum eröffnet. Das Museum widmet sich der Geschichte der Freiämter Hutgeflechtindustrie. Diese wird im Museum an der Bünzstrasse 5 in Wohlen vielseitig, multimedial, interaktiv und mit einzigartigen Originalen erzählt. In keiner anderen Region dieser Welt wurden im 19. Jahrhundert solch feine Hutgarnituren hergestellt wie im Freiamt. Stroh war in dieser Region zwei Jahrhunderte lang Grundlage eines blühenden Wirtschaftszweiges. Kinder zwischen 5 und 9 Jahren können das Museum auf eigene Faust entdecken und werden dabei vom Museums-Maskottchen Zaggli begleitet. Auch der wunderschöne Park lädt zum Verweilen ein.',
    ],
    link: { label: 'Strohmuseum', url: 'https://www.strohmuseum.ch' },
  },
  {
    slug: 'surfwelle',
    name: 'Surfwelle Bremgarten',
    book: 1,
    image: 'orte/surfwelle',
    paragraphs: [
      'Ein Surfmekka mitten im Freiamt. Die stehende Welle beim unteren Wehr gilt als einzige ideale Welle für Surfer in der Schweiz. Wenn die Temperaturen stimmen, tummeln sich hier Surferinnen und Surfer, die von nah und fern anreisen. Bei genügend Wasserfluss entsteht eine Welle, die niemals endet. Die Reuss wird dort vom (unter der Wasseroberfläche versteckten) Honegger-Wehr aufgehalten und wirft eine kleine, aber feine Flusswelle.',
      'Die Welle befindet sich unweit des Militärareals. Beim «Pegasus-Kreisel» die Umfahrung in Richtung Unterstadt verlassen. Vor der Reussbrücke nach links abbiegen. Das ganze Areal ist im Besitz der Schweizer Armee. Eine Feuerstelle mit einfachen Sitzgelegenheiten lädt zu einem Grillplausch ein. Dabei kann man die Surfer beim Wellenreiten beobachten',
    ],
    link: { label: 'Surfwelle', url: 'https://www.flusswellenbremgarten.ch' },
  },
  {
    slug: 'heidehuebelstein',
    name: 'Heidehübelstein Sarmenstorf',
    book: 1,
    image: 'orte/heidehuebelstein',
    paragraphs: [
      'Der Heidehübelstein ist ein Findling mit 1000 m3 Volumen. Er wurde vermutlich vom Reussgletscher zu Beginn der letzten Eiszeit abgelagert. Der Stein besteht aus alpinem Kieselkalk, was sehr selten ist.',
      'Er befindet sich im Südosten des Dorfes Sarmenstorf, im Wald neben einem Wanderweg (Google Maps hilft!). Der Heidehübelstein ist vom Dorfzentrum aus in etwa zehn Minuten zu erreichen. Der Stein ist mit Gesträuch bewachsen, aber von trittsicheren Besuchern gut zu erklettern. Vor Ort hat es einen Grillplatz und Sitzgelegenheiten. Der Heidehübelstein lädt Gross und Klein zum Verweilen ein.',
    ],
  },
  {
    slug: 'flachsee',
    name: 'Flachsee',
    book: 1,
    image: 'orte/flachsee',
    paragraphs: [
      'Durch den Neubau des Wasserkraftwerkes Emaus bei Zufikon entstand 1975 der Flachsee. Er liegt südlich von Bremgarten, nahe der Gemeinden Unterlunkhofen und Rottenschwil. In diesem wunderschönen Naturschutzgebiet, bestehend aus Sumpflandschaften, kleinen Inseln oder breiten Schilfgürteln, kann man eine beeindruckende Tier- und Pflanzenwelt bestaunen. Der Flachsee ist als Wasser- und Zugvogelreservat von nationaler Bedeutung. Rund 50 Vogelarten brüten regelmässig am Flachsee. Manchmal kann man auch seltene Vögel beobachten, wie beispielsweise 2011, als mehrere Flamingos dort Halt machten. Auch die angrenzende Reussuferlandschaft, das romantische Jonental mit der Einsiedelei und die Wallfahrtskapelle sind einen Besuch wert.',
    ],
    link: { label: 'Bremgarten Tourismus', url: 'https://www.bremgarten-tourismus.ch' },
  },
  {
    slug: 'guggibad',
    name: 'Guggibad',
    book: 1,
    image: 'orte/guggibad',
    paragraphs: [
      'Im 18. und 19. Jahrhundert war das «Guggibad» ein Heilbad mit – so heisst es – heiliger Quelle. 1865 brannte das Kurhaus nieder. Es wurde ein Gasthof gebaut. Das Restaurant Guggibad ist heute noch ein beliebter Ausflugsort. Aus der Guggibad-Quelle sprudelt nach wie vor Wasser von bester Qualität. Einmal pro Jahr ist dieser Ort auch in sportlicher Hinsicht ein Highlight für Jung und Alt. Seit über 60 Jahren messen sich beim Weiler oberhalb von Buttwil (der zur Gemeinde Bettwil gehört) die besten Schwinger der Region beim Guggibad-Schwinget.',
      'Der schönste Spielplatz ist der nahegelegene Wald. Dieser eignet sich auch bestens für abenteuerliche Spaziergänge. Das Restaurant hat ebenfalls einen grossen Spielplatz mit Klettergestell, Trampolin und Schaukel.',
    ],
  },
  {
    slug: 'kloster-muri',
    name: 'Kloster Muri',
    book: 1,
    image: 'orte/kloster-muri',
    paragraphs: [
      'Gegründet wurde das Kloster im Jahr 1027, also vor fast 1000 Jahren. Es wurde aufgrund seiner grossen historischen, architektonischen und kulturellen Bedeutung als Kulturgut von nationaler Bedeutung eingestuft. Es gilt als eines der bedeutendsten Wahrzeichen des Kantons Aargau.',
      'Heute ist das Kloster Muri ein kulturelles Zentrum von überregionaler Bedeutung. Dazu tragen vor allem die fünf Orgeln der Klosterkirche bei. Die Nutzung der übrigen Gebäude ist vielfältig (Schule, Bezirks- und Gemeindebehörden, öffentliche Bibliothek, Fachbibliothek und Pflegeheim). Das Kloster Muri hat ein Museum und es finden auch regelmässig Konzerte statt. Es gibt spezielle Führungen und Workshops für Kinder und im Park der Pflegi Muri sowie beim Klosterhof hat es einen Spielplatz.',
    ],
    link: { label: 'Murikultur', url: 'https://www.murikultur.ch' },
  },
  {
    slug: 'schloss-hallwyl',
    name: 'Schloss Hallwyl, Seengen',
    book: 2,
    image: 'orte/schloss-hallwyl',
    paragraphs: [
      'Das Schloss Hallwyl ist eines der bedeutendsten Wasserschlösser der Schweiz. Es entstand im 12. Jahrhundert und befindet sich auf zwei Inseln im Aabach, nahe dem nördlichen Ende des Hallwilersees. Das Schloss steht nicht im Freiamt, sondern auf dem Gebiet der Gemeinde Seengen. Seit 1925 ist es öffentlich zugänglich und seit 1994 im Besitz des Kantons Aargau. Es ist Teil des Museums Aargau.',
      'Das Schloss Hallwyl ist ein attraktives Ausflugsziel für Familien und Kinder. Egal, ob unter der Woche, am Wochenende, in den Ferien oder bei Schlechtwetter. In der Nähe hat es einige Feuerstellen.',
    ],
    link: { label: 'Weitere Informationen', url: 'https://www.museumaargau.ch/schloss-hallwyl' },
  },
  {
    slug: 'erdmannlistein',
    name: 'Erdmannlistein zwischen Wohlen und Bremgarten',
    book: 2,
    image: 'orte/erdmannlistein',
    paragraphs: [
      'Der sagenumwobene Stein liegt mitten im Wald und hat eine eigene Haltestelle (Linie S17 der AVA, früher Bremgarten-Dietikon-Bahn). Im Wald zwischen Bremgarten und Wohlen liegt dieser riesige Granitblock, der vom Reussgletscher vor langer Zeit hierhingetragen wurde. Er ist ein beliebtes Ausflugsziel bei Kindern und Familien.',
      'Im Mittelraum der Steingruppe sollen kleine Erdmännchen wohnen. Wer sie ruft und siebenmal mit angehaltenem Atem um den Stein rennt, soll die Erdmannli zu sehen bekommen (was aber schwierig bis unmöglich ist). Wenn man ihnen Kraut, Kohl oder Rüben gibt, beginnen sie zu tanzen. So lautet die Sage vom Erdmannlistein.',
    ],
  },
  {
    slug: 'feldenmoos',
    name: 'Feldenmoos, Boswil',
    book: 2,
    image: 'orte/feldenmoos',
    paragraphs: [
      'Drei Weiher bilden das Feldenmoos. Das Naherholungsgebiet liegt auf knapp 600 Metern über Meer in einem Waldstück und man hat keinen Handy-Empfang (was diesen Ort nur noch schöner macht). Beim Waldsee gibt es einen Rastplatz, eine Feuerstelle, viele Sitzgelegenheiten und gepflegte Pfade.',
      'Die Weiher und die Umgebung sind ein Amphibien-Laichgebiet von nationaler Bedeutung. Die Vereinsmitglieder des Fischereivereins Boswil pflegen die Weiheranlage und die Umgebung. Früher wurde hier Torf abgebaut. Mit dem Auto ist es nicht möglich, zum Feldenmoos zu gelangen. Zwischen Nieder- und Oberniesenberg kann man links Richtung Wald abzweigen und man findet gleich bei der Einfahrt in den Wald Parkplätze. Von dort aus erreicht man diesen besonderen Ort mit einem Spaziergang (rund 500 Meter).',
    ],
  },
  {
    slug: 'niedermatten',
    name: 'Niedermatten/Schüwo-Park, Wohlen',
    book: 2,
    image: 'orte/niedermatten',
    paragraphs: [
      'Nirgendwo sonst im Freiamt ist das Sportangebot so gross wie an diesem Ort. Tennis, Fussball, Leichtathletik, Eishockey, Schwimmen – und so weiter. Das Sportzentrum Niedermatten (2004 eröffnet) und gleich daneben der Schüwo-Park (Badi, Minigolf, Beachsport und Eisbahn) sind ein Sport-Mekka.',
      'Die Badi (mit der längsten Wasserrutsche im Freiamt) und die Eisbahn (die einzige in der Region) sind kostenpflichtig (Informationen unter www.schuewo-park.ch). Was viele nicht wissen: Auch wenn das Freibad geschlossen ist, ist der Park (mit tollem Spielplatz) frei zugänglich, auch ein Bistro ist vorhanden. In den Niedermatten stehen unter anderem der Kunststoffplatz (Fussball, Handball, Basketball), der Inlinehockeyplatz und zwei Kinderspielplätze der Öffentlichkeit zur Verfügung.',
    ],
  },
  {
    slug: 'auw',
    name: 'Auw',
    book: 2,
    image: 'orte/auw',
    paragraphs: [
      'Die Gemeinde liegt am Fuss des Lindenbergs und besteht aus den Ortsteilen Auw und Rüstenschwil. Und das Dorf mit den rund 2300 Einwohnern hat einiges zu bieten. Nebst alten Wegkreuzen, einem Rehgarten und einem alten Speicher von 1618 (dem ältesten im Bezirk) steht in Auw auch das Geburtshaus von Maria Bernarda Bütler (1848–1924). Sie ist eine der berühmtesten Persönlichkeiten des Freiamts. Zu Ehren von Maria Bernarda Bütler wurde ein rund einen Kilometer langer Besinnungsweg mit fünf Objekten geschaffen.',
      'Ebenfalls einen Besuch wert ist die Reusseggmauer. Im Wald zwischen Reussegg und Auw stehen auf einer Länge von über einem Kilometer Granitfindlinge im Boden. Genau geklärt ist der Zweck dieser Abgrenzung nicht. Man vermutet aber, dass es sich um eine prähistorische Grenze handelt.',
    ],
  },
  {
    slug: 'buenz',
    name: 'Bünz',
    book: 2,
    image: 'orte/buenz',
    paragraphs: [
      'Der Freiämter «Hausfluss». Die Bünz ist 26 Kilometer lang und durchquert von Süden nach Norden die Bezirke Muri, Bremgarten und Lenzburg. Die erste urkundliche Erwähnung des Flusses war 1426 «an die Buntzen». Die Quelle der Bünz liegt im Freiamt oberhalb von Winterschwil am Lindenberg. Das 122,61 km2 grosse Einzugsgebiet der Bünz wird über den Aabach, die Aare und den Rhein zur Nordsee entwässert.',
      'Den Flusslauf der Bünz entlang gibt es viele tolle Ausflugsmöglichkeiten, wie das Murimoos oder die Spielplätze bei den Schulhäusern Junkholz und Bünzmatt in Wohlen. Doch nur schon ein Spaziergang an der Bünz ist ein Höhepunkt für die ganze Familie.',
    ],
  },
  {
    slug: 'sandbank',
    name: 'Sandbank, Fischbach-Göslikon',
    book: 2,
    image: 'orte/sandbank',
    paragraphs: [
      'Ein magischer und friedvoller Ort. Bei der Sandbank in Fischbach-Göslikon ist es in den warmen Monaten toll, um baden zu gehen (auch für Kinder geeignet, weil es flach ist und wenig Strömung hat). In der Nähe hat es auch eine schöne Feuerstelle und Sitzgelegenheiten. Im Sommer ist auch die am anderen Reussufer (Künten Sulz) gelegene Fähre in Betrieb (www.faehriverein.ch). Die natürliche Sandbank am Ufer der Reuss ist ein beliebter Ausflugsort und ein Naherholungsgebiet.',
      'Es gilt ein Fahrverbot zu den Sandbänken in Fischbach-Göslikon. Parkmöglichkeiten gibt es im Dorf. Von dort aus ist der idyllische Ort zu Fuss gut erreichbar.',
    ],
  },
  {
    slug: 'maiengruenturm',
    name: 'Maiengrünturm, Hägglingen',
    book: 2,
    image: 'orte/maiengruenturm',
    paragraphs: [
      'Das Maiengrün – der höchste der sieben Hügel im Nordwesten von Hägglingen – ist zu einem Wahrzeichen des Dorfes geworden. Der Turm wurde 1929 erbaut, 1938 erhöht und 2020 saniert. Der Turm besteht aus 15000 kg Stahl und nach 170 Stufen ist man zuoberst angelangt.',
      'Rund um den Turm ist Wald. Auf der abgeholzten Hochwacht stehen das Restaurant Maiengrün und der 35 Meter hohe Aussichtsturm. Bei klaren Wetterverhältnissen kann man eine wunderbare Aussicht geniessen, von den Alpen bis hin zum Schwarzwald. Beim Restaurant ist zudem ein Spielplatz (inklusive Spielbagger und Karussell) vorhanden. Der Maiengrünturm ist ganzjährig während 24 Stunden offen. Parkplätze gibt es gleich beim Turm. Kinder unter 12 Jahren dürfen nur in Begleitung von Erwachsenen auf den Turm.',
    ],
  },
  {
    slug: 'soeriker-tobel',
    name: 'Söriker Tobel, Muri',
    book: 2,
    image: 'orte/soeriker-tobel',
    paragraphs: [
      'Das Söriker Tobel mit seinem besonderen Bachverlauf ist ein beliebtes Wander- und Ausflugsziel. Die natürliche Umgebung mitten im Wald und mit dem Bach bietet einen wundervollen Spiel- und Erholungsraum für die ganze Familie. Ein besonderer Anreiz bietet sich jeweils im Winter, wenn es länger kalt ist und sich wundervolle Eisskulpturen bilden. Aber auch in den warmen Monaten hat dieser idyllische Ort seinen Reiz – für Gross und Klein. Parkieren kann man beispielsweise beim Kloster Muri und hinauf zum Söriker Tobel spazieren.',
      'Übrigens: Das Söriker Tobel bot Caspar Wolf, dem späteren Pionier der Hochgebirgsmalerei, ganz viel Inspiration. Der Murianer ist einer der bedeutendsten Schweizer Maler.',
    ],
  },
  {
    slug: 'murimoos',
    name: 'Murimoos, Muri',
    book: 2,
    image: 'orte/murimoos',
    paragraphs: [
      'Murimoos bietet geschützte Wohn- und Arbeitsmöglichkeiten mit vielseitigen Betrieben wieder Bio-Landwirtschaft und der Holzproduktion. Das Murimoos ist auch ein Naherholungsgebiet. Mit seinem Restaurant, den Bio-Läden, dem Holz- und Wasserspielplatz sowie dem Murimoosweg, auf dem man mit den vielen Tieren im Murimoos in Kontakt kommt, ist dieser Ort ein Ausflugsziel für Familien. Der grosse Murimoos-Spielplatz ist eine dauerhafte Ausstellung von Spielgeräten, die in der Holzabteilung des Betriebs hergestellt wurden.',
      'Der Mittelpunkt des Freiamts liegt beim Tiergehege der Geissli. Gemäss Berechnungen des Kantonsgeometers ziemlich genau beim Brunnen. Eventuell hat Chnorrlimorrli dort nun auch einen kleinen Platz erhalten, den man besuchen kann. Einfach vorbeigehen und selbst erkunden.',
    ],
  },
];
