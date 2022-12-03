#!/bin/bash
##################################################
#
#            ** BASE VERSION **
#
##################################################
# Version: 2022-12-03
for keyval in  $(grep -E '": [^\{]' ./app/config/base.json | sed -e 's/: /=/' -e "s/\(\,\)$//"); do
    echo 'export ' $keyval && eval export $keyval
    #echo $keyval | sed 's/"//g' >> ./docker.env
done;

if [$baseElmer != "true"]
then
    cp ../baseapijwt/app/routes/_route.js ./app/routes/
    cp ../baseapijwt/app/_app.js ./app/
    cp ../baseapijwt/_index.js .
    cp ../baseapijwt/_rebuilddocker.sh .
fi
