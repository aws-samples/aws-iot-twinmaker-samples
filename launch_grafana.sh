#!/usr/bin/env bash

# attach IAM role
instance_id=$(wget -q -O - http://169.254.169.254/latest/meta-data/instance-id)
aws ec2 associate-iam-instance-profile \
    --instance-id $instance_id \
    --iam-instance-profile Name="iottwinmaker_development_role"

# install docker
install docker
sudo yum update -y
sudo amazon-linux-extras install docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# running open source grafama version 8.2.4 for ubuntu
docker run -d -p 3000:3000 --name grafana grafana/grafana-oss:8.2.4-ubuntu

# store container id in variable
container_id=$(docker container ls  | grep 'grafana' | awk '{print $1}')

# copy config file into container and overwrite config
# enables anonomous Viewer role and iFrame embedding capability
docker cp grafana.ini $container_id:/etc/grafana/

# Must restart container to reflect changes
docker restart grafana