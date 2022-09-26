	#!/bin/bash

ELGATO_LOCATION=192.168.1.4

curl --location --request PUT "http://${ELGATO_LOCATION}:9123/elgato/lights" \
--header 'Content-Type: application/json' \
--data-raw '{"lights":[{"on":0}],"numberOfLights":1}'
