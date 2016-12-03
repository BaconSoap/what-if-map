#!/bin/sh

SOURCE_URL='http://www2.census.gov/geo/tiger/GENZ2015/shp/cb_2015_us_county_500k.zip'
SHP_FILE='cb_2015_us_county_500k.shp'
DBF_FILE='cb_2015_us_county_500k.dbf'
MAPSHAPER='../node_modules/.bin/mapshaper'

# download file
mkdir -p data
cd data
curl $SOURCE_URL >> source.zip
unzip -o source.zip $SHP_FILE $DBF_FILE
mv $SHP_FILE data.shp
mv $DBF_FILE data.dbf

rm counties.json states.json 2> /dev/null

# process data

$MAPSHAPER data.shp -simplify 10% -o counties.json force id-field=GEOID format=geojson
$MAPSHAPER data.shp -simplify 10% -dissolve STATEFP -o states.json force id-field=STATEFP format=geojson

rm data.dbf data.shp source.zip

cd ..
