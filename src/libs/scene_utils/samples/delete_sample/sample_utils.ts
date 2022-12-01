// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2022
// SPDX-License-Identifier: Apache-2.0

import minimist from 'minimist';

export interface DeleteSampleArguments {
  workspaceId: string;
  sceneId: string;
  deleteAll?: boolean;
}

export const help = () => {
  console.log(`Configure the AWS credentials and AWS region in your environment by setting env variables:
    * AWS_ACCESS_KEY_ID
    * AWS_SECRET_ACCESS_KEY
    * AWS_SESSION_TOKEN
    * AWS_REGION (e.g. us-east-1)
  
  Usage: 
    
    arguments:
      --workspaceId   REQUIRED
      --sceneId       REQUIRED
      --deleteAll     OPTIONAL
    
    Delete all nodes in a scene:
      npx ts-node src/delete_sample/sample.ts --workspaceId CookieFactory --sceneId FactoryScene
    
    Delete the scene:
      npx ts-node src/delete_sample/sample.ts --workspaceId CookieFactory --sceneId FactoryScene --deleteAll
    `);
};

// Parses command-line arguments for the sample files to extract the supported settings.
export const parseArgs = (): DeleteSampleArguments => {
  const args: DeleteSampleArguments = {
    workspaceId: '',
    sceneId: '',
    deleteAll: false,
  };
  const parsedArgs = minimist(process.argv.slice(2));
  for (const arg of Object.keys(parsedArgs)) {
    switch (arg) {
      case 'h':
      case 'help':
        help();
        process.exit(0);
      case 'workspaceId':
        args.workspaceId = parsedArgs[arg];
        break;
      case 'sceneId':
        args.sceneId = parsedArgs[arg];
        break;
      case 'deleteAll':
        args.deleteAll = parsedArgs[arg];
        break;
      case '_':
        break;
      default:
        console.error(`unknown arg "--${arg}"`);
        help();
        process.exit(1);
    }
  }

  if (args.workspaceId === '' || args.sceneId === '') {
    help();
    process.exit(1);
  }
  return args;
};
