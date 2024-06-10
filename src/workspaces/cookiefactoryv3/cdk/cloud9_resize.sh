#!/bin/bash

# Specify the desired volume size in GiB as a command line argument. If not specified, default to 20 GiB.
SIZE=${1:-20}


get_metadata() {
  local path=$1
  TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
  curl -H "X-aws-ec2-metadata-token: $TOKEN" -s "http://169.254.169.254/latest/meta-data/$path"
}

# Get the ID of the environment host Amazon EC2 instance.
INSTANCEID=$(get_metadata "instance-id")
if [ -z "$INSTANCEID" ]; then
  echo "Failed to retrieve instance ID. Aborting."
  exit 1
fi
echo "Instance ID: $INSTANCEID"

# Get the availability zone of the instance
AVAILABILITY_ZONE=$(get_metadata "placement/availability-zone")
if [ -z "$AVAILABILITY_ZONE" ]; then
  echo "Failed to get availability zone. Aborting."
  exit 1
fi

# Extract the region from the availability zone (e.g., "us-east-1a" -> "us-east-1")
REGION=${AVAILABILITY_ZONE::-1}
echo "Region: $REGION"

# Get the ID of the Amazon EBS volume associated with the instance.
VOLUMEID=$(aws ec2 describe-instances \
  --instance-id $INSTANCEID \
  --query "Reservations[0].Instances[0].BlockDeviceMappings[0].Ebs.VolumeId" \
  --output text \
  --region $REGION)


# Resize the EBS volume.
aws ec2 modify-volume --volume-id $VOLUMEID --size $SIZE
if [ $? -ne 0 ]; then
  echo "Failed to modify volume. Aborting."
  exit 1
fi

# Wait for the resize to finish.
while [ \
  "$(aws ec2 describe-volumes-modifications \
    --volume-id $VOLUMEID \
    --filters Name=modification-state,Values="optimizing","completed" \
    --query "length(VolumesModifications)"\
    --output text)" != "1" ]; do
sleep 1
done


# Function to determine the filesystem type and resize accordingly
resize_filesystem() {
  local partition=$1

  # Determine the filesystem type
  fstype=$(lsblk -no FSTYPE $partition)
  echo "Filesystem type: $fstype"

  if [[ "$fstype" == "xfs" ]]; then
    sudo xfs_growfs $partition
  elif [[ "$fstype" == "ext2" || "$fstype" == "ext3" || "$fstype" == "ext4" ]]; then
    sudo resize2fs $partition
  else
    echo "Unsupported filesystem type: $fstype. Aborting."
    exit 1
  fi
}

# Check if we're on an NVMe filesystem
if [[ -e "/dev/xvda" && $(readlink -f /dev/xvda) = "/dev/xvda" ]]; then
  # Rewrite the partition table so that the partition takes up all the space that it can.
  sudo growpart /dev/xvda 1

  # Expand the size of the file system.
  resize_filesystem /dev/xvda1
else
  # Rewrite the partition table so that the partition takes up all the space that it can.
  sudo growpart /dev/nvme0n1 1

  # Expand the size of the file system.
  resize_filesystem /dev/nvme0n1p1
fi
