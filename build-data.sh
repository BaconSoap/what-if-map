#!/bin/sh

SOURCE_URL='http://www2.census.gov/geo/tiger/GENZ2015/shp/cb_2015_us_county_500k.zip'
SHP_FILE='cb_2015_us_county_500k.shp'
DBF_FILE='cb_2015_us_county_500k.dbf'
MAPSHAPER='../node_modules/.bin/mapshaper'
DATA_ALL_URL='https://raw.githubusercontent.com/tonmcg/County_Level_Election_Results_12-16/master/US_County_Level_Presidential_Results_12-16.csv'
POP_URL='https://raw.githubusercontent.com/BaconSoap/datasets/master/population-2015/2015-population.csv'

# download data
mkdir -p data
cd data

# clean existing data
rm counties.json states.json 2> /dev/null

curl $SOURCE_URL >> source.zip
unzip -o source.zip $SHP_FILE $DBF_FILE
mv $SHP_FILE data.shp
mv $DBF_FILE data.dbf

curl $DATA_ALL_URL >> all_results.csv
curl $POP_URL >> 2015_population.csv


# process data

$MAPSHAPER data.shp -simplify 10% \
  -each 'NUMERIC_ID=parseInt(GEOID, 10)' \
  -join all_results.csv keys=NUMERIC_ID,combined_fips \
  -join 2015_population.csv keys=NUMERIC_ID,FIPS \
  -filter-fields "total_votes_2012,total_votes_2016,votes_dem_2012,votes_dem_2016,votes_gop_2012,votes_gop_2016,county_name,state_abbr,POP_ESTIMATE_2015,STATEFP" \
  -o counties.json force id-field=GEOID format=geojson

$MAPSHAPER counties.json \
  -dissolve STATEFP sum-fields='POP_ESTIMATE_2015' copy-fields='state_abbr' \
  -o states.json force id-field=STATEFP format=geojson

rm data.dbf data.shp source.zip all_results.csv 2015_population.csv

cd ..
