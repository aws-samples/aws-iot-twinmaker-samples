#!/bin/sh

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

# get current script dir
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)

# clone the chainlit repo if it is not already cloned
if [ ! -d "$SCRIPT_DIR/chainlit" ]; then
    git clone https://github.com/Chainlit/chainlit.git $SCRIPT_DIR/chainlit
fi

#### START - Building the chainlit project ####
pushd $SCRIPT_DIR/chainlit

git reset --hard 6189fc1f6cb4f2066d08f11ffba33527b12dd5a5
git apply $SCRIPT_DIR/patch.diff

# install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -

# install poetry
python3 -m pip install poetry

# install node dependencies
pnpm install

# build the project
pnpm build

# install chainlit
pushd src
poetry install
popd

popd
#### END - Building the chainlit project ####

# install app dependencies
python3 -m pip install -r requirements.txt

echo "assistant app setup complete"
