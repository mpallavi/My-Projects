for $x in doc('WineSchema.xml')//bottle
where $x/vintage
order by $x/wine/alcoholbyvolume descending
return $x/wine/variety

(: for $x in doc('WineSchema.xml')//bottle
where $x/wine[contains(variety,'Chardonnay')]
return $x/wine :)

(: for $x in doc('WineSchema.xml')//bottle
where $x/wine/descriptors/fruit/text() = 'Blueberry'
return $x/wine :)

