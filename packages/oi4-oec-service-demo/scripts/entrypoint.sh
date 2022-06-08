#!/bin/ash

while true
do
  tail -f /dev/null & wait ${!}
done

exit 0
