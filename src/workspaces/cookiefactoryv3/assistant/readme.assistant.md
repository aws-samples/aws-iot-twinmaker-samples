# Note: This project is intended as a non-production sample application to demonstrate an integration between an AWS IoT TwinMaker dashboard and AWS Bedrock and should not be run in production accounts

This README walks you through setting up the optional AI assistant for the Bakersville Cookie Factory Digital Twin Monitoring Application powered by AWS IoT TwinMaker.

### Setup AI assistant

- Set environment variables for convenience. Note: "WORKSPACE_ID" is the same as "Workspace Name" on some console pages.
  ```shell
  export AWS_REGION=__FILL_IN__
  export WORKSPACE_ID=__FILL_IN__
  ```

- Prepare environment (run from the same directory as this README). Note: can take 10-20 minutes for chainlit to build.
  ```shell
  cd assistant && ./install.sh
  ```

### Run AI assistant (run from `assistant` directory)

- Prepare environment (run from the same directory as this README)
  ```shell
  ./run.sh
  ```

### Interact with AI assistant

After starting the dashboard application and selecting the user and site, click on the "Run event simulation" button at the top to start the AI assistant. 

## Cleanup

- Navigate back to `assistant` folder for the following steps

  ```shell
  ./stop.sh
  ```

---

## License

This project is licensed under the Apache-2.0 License.
