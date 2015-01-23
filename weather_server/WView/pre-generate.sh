#/bin/sh

# Add any pre template generation processing or utilities here. Keep in mind this 
# script runs in the htmlgend process's context so don't add anything that is overly
# time constrained.

timeUTC=$(date -u +%Y,%m,%d,%H,%M,%S)

sed -ie "s/\(.*timeUTC\":\"\)[^\"]*\(.*\)/\1$timeUTC\2/" /etc/wview/html/customclientraw.txtx

exit 0

