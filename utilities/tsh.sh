#!/bin/bash

project="$1"
environment="$2"

curr=pwd
cd ~/Github/$1
git pull origin master
cd $pwd

line="$(cat ~/dev/$1/Capfile | sed -n -e "/task \:$environment/,\$p" | sed -n -e "/server/,\$p" | head -n 1)"

split=(${line//\'/ })
address=${split[1]}

echo "sshing to $environment $project at $address"

ssh -t $address "sudo -u deployer -i && pwd"
