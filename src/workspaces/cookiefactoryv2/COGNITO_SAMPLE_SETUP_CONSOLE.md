# AWS IoT TwinMaker Cookie Factory Demo: Setting up user authentication in Amazon Cognito

The web application requires a specific Amazon Cognito profile, which corresponds to the built-in user persona, that grants the application access to backend resources.

**The following is an sample Amazon Cognito configuration. Please adjust as appropriate for your organization's security policy.**

## Setting up your Amazon Cognito user pool

In Amazon Cognito, under User Pools:

* Click the 'Create user pool' button.
* In 'Configure sign-in experience', select 'Email' under 'Cognito user pool sign-in options', then hit 'Next'.
* In 'Configure security requirements', under 'Multi-factor authentication', select 'No MFA', then hit 'Next'.
* In 'Configure sign-up experience', under 'Self-service sign-up', deselect 'Enable self-registration.'
* Under 'Attribute verification and user account confirmation', deselect 'Allow Cognito to automatically send messages to verify and confirm - Recommended'. Then click 'Next'.
* In 'Configure message delivery', select 'Send email with Cognito' and do not add a 'REPLY-TO email address'. Then click 'Next'.
* In 'Integrate your app', name your user pool whatever you'd like.
* Under 'Initial app client', select 'Other', and name your app whatever you'd like.
* Under 'Advanced app client settings', open the 'Authentication flows' dropdown and select ''ALLOW_USER_SRP_AUTH'. Then click 'Next'.
* Finally, review your settings and click 'Create'.

### Adding an Amazon Cognito user

* On your newly created user pool detail page, scroll to find the 'Users' tab and click 'Create user'.
* Under 'User information', enter an email address **(this can be a fake email address; in a subsequent step, you will confirm it administratively)** and check 'Mark email address as verified'. **Because you will set a permanent password in the last step, you may choose to have an initial password generated for you at this stage.**
* Click "Create User"

## Setting up your Amazon Cognito Federated Identity pool

In Amazon Cognito, under Federated Identities:

* Click the 'Create new identity pool' button.
* Name your identity pool.
* Scroll to 'Authentication providers' and expand it.
* Enter the 'User Pool ID' and 'App client id' for the user pool you just created (App client id is found under 'App integration' and 'App clients and analytics' in the user pool dashboard).
* Click 'Create pool'.
* On the next step, add a policy to the newly created Authenticated role (you don't need to change the Unauthenticated role). Copy and paste the following JSON. **Replace `[ACCOUNT_ID]`, `[WORKSPACE_NAME]`, and `[WORKSPACE_BUCKET]` with your Amazon account id and your AWS IoT TwinMaker workspace details, respectively.**
* Note down the identity pool id (can be found either in the "Sample code" tab to the left or from the URL after `pool=`), you will need it later to configure the web application

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "mobileanalytics:PutEvents",
            "cognito-sync:*",
            "cognito-identity:*"
          ],
          "Resource": [
            "*"
          ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "iottwinmaker:GetPropertyValue",
                "iottwinmaker:ExecuteQuery",
                "iottwinmaker:ListEntities",
                "iottwinmaker:ListComponentTypes",
                "iottwinmaker:GetPropertyValueHistory",
                "iottwinmaker:GetScene",
                "iottwinmaker:ListScenes",
                "iottwinmaker:GetEntity",
                "iottwinmaker:GetWorkspace",
                "iottwinmaker:GetComponentType"
            ],
            "Resource": [
                "arn:aws:iottwinmaker:us-east-1:[ACCOUNT_ID]:workspace/[WORKSPACE_NAME]/*",
                "arn:aws:iottwinmaker:us-east-1:[ACCOUNT_ID]:workspace/[WORKSPACE_NAME]"
            ]
        },
        {
            "Effect": "Allow",
            "Action": "iottwinmaker:ListWorkspaces",
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::[WORKSPACE_BUCKET]/*"
        }
    ]
}
```

## Administratively set the Amazon Cognito user password

After setting up the above, the Cognito user will be created but not usable until its password is set. You can use the following CLI command to administratively set the password for your user. **Note the email address and password for when you configure the web application.** Be sure the password meets the default Cognito password requirements (Lowercase letter, Uppercase letter, Number, Symbol, Length >= 8)

```
aws cognito-idp admin-set-user-password --user-pool-id "[YOUR_USER_POOL_ID]" --username "[USERNAME]" --password "[PASSWORD]" --permanent
```

You should now have Cognito and Users configured and usable for the [remaining steps](./README.md)

---

## License

This project is licensed under the Apache-2.0 License.
