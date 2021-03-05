#!/bin/bash

prev=`tail -n1 /root/rhs/up-to-date.tsv  | tr '\t' '\n' | head -n1`
next=$((prev+1))
echo $prev $next
node /root/rhs/update.js $next
(head -n1 /root/rhs/up-to-date.tsv && tail -n+2 /root/rhs/up-to-date.tsv | sort -t$'\t' -r -n -k7 ) > /root/rhs/data.tsv
aws s3api put-object --bucket orchidex --key data.tsv --body /root/rhs/data.tsv
