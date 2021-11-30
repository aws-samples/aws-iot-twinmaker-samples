"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiteWiseStack = void 0;
const cdk = require("@aws-cdk/core");
const iam = require("@aws-cdk/aws-iam");
const lambda = require("@aws-cdk/aws-lambda");
const sfn = require("@aws-cdk/aws-stepfunctions");
const tasks = require("@aws-cdk/aws-stepfunctions-tasks");
const path = require("path");
const console = require("console");
class SiteWiseStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // The code that defines your stack goes here
        const iottwinmaker_connector_role = new iam.Role(this, 'iottwinmaker_connector_role', {
            assumedBy: new iam.CompositePrincipal(
                new iam.ServicePrincipal('lambda.amazonaws.com'),
                new iam.ServicePrincipal('states.amazonaws.com'),
                new iam.ServicePrincipal('events.amazonaws.com'),
                new iam.ServicePrincipal('iottwinmaker.amazonaws.com')
            ),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AWSStepFunctionsReadOnlyAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite')
            ]
        });
        const policy = new iam.ManagedPolicy(this, "IoTTwinMakerFullAccessPolicy", {
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ["*"],
                    resources: ["*"]
                })
            ],
            roles: [iottwinmaker_connector_role]
        });
        console.log("PWD:" + __dirname);
        const iottwinmaker_env = new lambda.LayerVersion(this, 'iottwinmaker_env', {
            code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', '..', '..', '..', 'src', 'libs', 'connector_utils')),
            compatibleRuntimes: [lambda.Runtime.PYTHON_3_9, lambda.Runtime.PYTHON_3_8, lambda.Runtime.PYTHON_3_7]
        });
        /***************************/
        /* SiteWise step function */
        /***************************/
        const sitewise_exporter_lambda = new lambda.Function(this, 'sitewiseExporterLambda', {
            code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', '..', 'sitewise', 'lib')),
            handler: this.node.tryGetContext('SiteWiseExporterHandler'),
            memorySize: 256,
            role: iottwinmaker_connector_role,
            runtime: lambda.Runtime.PYTHON_3_9,
            timeout: cdk.Duration.minutes(15),
            layers: [iottwinmaker_env],
            environment: {
                'AWS_ENDPOINT': this.node.tryGetContext('AWSAPIEndpoint')
            }
        });
        const iottwinmaker_sitewise_importer = new lambda.Function(this, 'iottwinmakerSiteWiseImporterLambda', {
            code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', '..', 'sitewise', 'lib')),
            handler: this.node.tryGetContext('IoTTwinMakerSiteWiseImporterHandler'),
            memorySize: 256,
            role: iottwinmaker_connector_role,
            runtime: lambda.Runtime.PYTHON_3_9,
            timeout: cdk.Duration.minutes(15),
            layers: [iottwinmaker_env],
            environment: {
                'AWS_ENDPOINT': this.node.tryGetContext('AWSAPIEndpoint')
            }
        });
        const sitewise_export_task = new tasks.LambdaInvoke(this, 'sitewise_export', {
            lambdaFunction: sitewise_exporter_lambda,
            outputPath: '$.Payload'
        });
        const sitewise_import_task = new tasks.LambdaInvoke(this, 'sitewise_import', {
            lambdaFunction: iottwinmaker_sitewise_importer
        });
        const sitewise_sfn_defn = sitewise_export_task.next(sitewise_import_task);
        const sitewise_sfn = new sfn.StateMachine(this, 'sitewise_to_iottwinmaker', {
            definition: sitewise_sfn_defn
        });
    }
}
exports.SiteWiseStack = SiteWiseStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2l0ZXdpc2Utc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzaXRld2lzZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUVBQXFFO0FBQ3JFLHNDQUFzQzs7O0FBRXRDLHFDQUFxQztBQUNyQyx3Q0FBd0M7QUFDeEMsOENBQThDO0FBQzlDLGtEQUFrRDtBQUNsRCwwREFBMEQ7QUFFMUQsNkJBQTZCO0FBQzdCLG1DQUFvQztBQUVwQyxNQUFhLGFBQWMsU0FBUSxHQUFHLENBQUMsS0FBSztJQUN4QyxZQUFZLEtBQW9CLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQ2hFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDZDQUE2QztRQUM3QyxNQUFNLDJCQUEyQixHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsNkJBQTZCLEVBQUU7WUFDbEYsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLGtCQUFrQixDQUNqQyxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQyxFQUNoRCxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQyxFQUNoRCxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQyxFQUNoRCxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyw0QkFBNEIsQ0FBQyxFQUN0RCxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQywyQkFBMkIsQ0FBQyxFQUNyRCxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsRUFBRSxjQUFjO1lBQ3hELElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxDQUFFLGdCQUFnQjthQUM3RDtZQUNELGVBQWUsRUFBRTtnQkFDYixHQUFHLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDLG9CQUFvQixDQUFDO2dCQUNoRSxHQUFHLENBQUMsYUFB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QUMsRUFBRSxDQUFDO1lBQ2pDLE1BQU0sRUFBRSxDQUFDLGdCQUFnQixDQUFDO1lBQzFCLFdBQVcsRUFBRTtnQkFDVCxjQUFjLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUM7YUFDNUQ7U0FDSixDQUFDLENBQUM7UUFDSCxNQUFNLG9CQUFvQixHQUFHLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDekUsY0FBYyxFQUFFLHdCQUF3QjtZQUN4QyxVQUFVLEVBQUUsV0FBVztTQUMxQixDQUFDLENBQUM7UUFDSCxNQUFNLG9CQUFvQixHQUFHLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDekUsY0FBYyxFQUFFLDhCQUE4QjtTQUNqRCxDQUFDLENBQUM7UUFDSCxNQUFNLGlCQUFpQixHQUFHLG9CQUFvQixDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQzFFLE1BQU0sWUFBWSxHQUFHLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsMEJBQTBCLEVBQUU7WUFDeEUsVUFBVSxFQUFFLGlCQUFpQjtTQUNoQyxDQUFDLENBQUM7SUFFUCxDQUFDO0NBQ0o7QUFsRkQsc0NBa0ZDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vLyBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQXBhY2hlLTIuMFxuXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnQGF3cy1jZGsvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnQGF3cy1jZGsvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBzZm4gZnJvbSAnQGF3cy1jZGsvYXdzLXN0ZXBmdW5jdGlvbnMnO1xuaW1wb3J0ICogYXMgdGFza3MgZnJvbSAnQGF3cy1jZGsvYXdzLXN0ZXBmdW5jdGlvbnMtdGFza3MnO1xuXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGNvbnNvbGUgPSByZXF1aXJlKCdjb25zb2xlJyk7XG5cbmV4cG9ydCBjbGFzcyBTaXRlV2lzZVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgICAgICAvLyBUaGUgY29kZSB0aGF0IGRlZmluZXMgeW91ciBzdGFjayBnb2VzIGhlcmVcbiAgICAgICAgY29uc3QgaW90dHdpbm1ha2VyX2Nvbm5lY3Rvcl9yb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdpb3R0d2lubWFrZXJfY29ubmVjdG9yX3JvbGUnLCB7XG4gICAgICAgICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uQ29tcG9zaXRlUHJpbmNpcGFsKFxuICAgICAgICAgICAgICAgIG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgICAgICAgICAgICBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ3N0YXRlcy5hbWF6b25hd3MuY29tJyksXG4gICAgICAgICAgICAgICAgbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdldmVudHMuYW1hem9uYXdzLmNvbScpLFxuICAgICAgICAgICAgICAgIG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnaW90dHdpbm1ha2VyLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgICAgICAgICAgICBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2lvdHR3aW5tYWtlci5hd3MuaW50ZXJuYWwnKSxcbiAgICAgICAgICAgICAgICBuZXcgaWFtLkFjY291bnRQcmluY2lwYWwoJ3h4eHh4eHh4eHh4eCcpLCAvL2JldGEgYWNjb3VudFxuICAgICAgICAgICAgICAgIG5ldyBpYW0uQWNjb3VudFByaW5jaXBhbCgneHh4eHh4eHh4eHh4JykgIC8vZ2FtbWEgYWNjb3VudCBcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICAgICAgICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvblMzRnVsbEFjY2VzcycpLFxuICAgICAgICAgICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQ2xvdWRXYXRjaExvZ3NGdWxsQWNjZXNzJyksXG4gICAgICAgICAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBV1NTdGVwRnVuY3Rpb25zUmVhZE9ubHlBY2Nlc3MnKSxcbiAgICAgICAgICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ1NlY3JldHNNYW5hZ2VyUmVhZFdyaXRlJylcbiAgICAgICAgICAgIF1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgcG9saWN5ID0gbmV3IGlhbS5NYW5hZ2VkUG9saWN5KHRoaXMsIFwiSW9UVHdpbk1ha2VyRnVsbEFjY2Vzc1BvbGljeVwiLCB7XG4gICAgICAgICAgICBzdGF0ZW1lbnRzOiBbXG4gICAgICAgICAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbnM6IFtcIipcIiBdLFxuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFtcIipcIl1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJvbGVzOiBbaW90dHdpbm1ha2VyX2Nvbm5lY3Rvcl9yb2xlXVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zb2xlLmxvZyhcIlBXRDpcIiArIF9fZGlybmFtZSlcbiAgICAgICAgY29uc3QgaW90dHdpbm1ha2VyX2VudiA9IG5ldyBsYW1iZGEuTGF5ZXJWZXJzaW9uKHRoaXMsICdpb3R0d2lubWFrZXJfZW52Jywge1xuICAgICAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICcuLicsICcuLicsICcuLicsICcuLicsICdzcmMnLCAnbGlicycsICdjb25uZWN0b3JfdXRpbHMnKSksXG4gICAgICAgICAgICBjb21wYXRpYmxlUnVudGltZXM6IFtsYW1iZGEuUnVudGltZS5QWVRIT05fM185LCBsYW1iZGEuUnVudGltZS5QWVRIT05fM184LCBsYW1iZGEuUnVudGltZS5QWVRIT05fM183XVxuICAgICAgICB9KTtcblxuICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuICAgICAgICAvKiBTaXRlV2lzZSBzdGVwIGZ1bmN0aW9uICovXG4gICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICAgICAgY29uc3Qgc2l0ZXdpc2VfZXhwb3J0ZXJfbGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnc2l0ZXdpc2VFeHBvcnRlckxhbWJkYScsIHtcbiAgICAgICAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnLi4nLCAnLi4nLCAnc2l0ZXdpc2UnLCAnbGliJykpLFxuICAgICAgICAgICAgaGFuZGxlcjogdGhpcy5ub2RlLnRyeUdldENvbnRleHQoJ1NpdGVXaXNlRXhwb3J0ZXJIYW5kbGVyJyksXG4gICAgICAgICAgICBtZW1vcnlTaXplOiAyNTYsXG4gICAgICAgICAgICByb2xlOiBpb3R0d2lubWFrZXJfY29ubmVjdG9yX3JvbGUsXG4gICAgICAgICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5QWVRIT05fM185LFxuICAgICAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMTUpLFxuICAgICAgICAgICAgbGF5ZXJzOiBbaW90dHdpbm1ha2VyX2Vudl0sXG4gICAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgICAgICdBV1NfRU5EUE9JTlQnOiB0aGlzLm5vZGUudHJ5R2V0Q29udGV4dCgnQVdTQVBJRW5kcG9pbnQnKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBpb3R0d2lubWFrZXJfc2l0ZXdpc2VfaW1wb3J0ZXIgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdpb3R0d2lubWFrZXJTaXRlV2lzZUltcG9ydGVyTGFtYmRhJywge1xuICAgICAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICcuLicsICcuLicsICdzaXRld2lzZScsICdsaWInKSksXG4gICAgICAgICAgICBoYW5kbGVyOiB0aGlzLm5vZGUudHJ5R2V0Q29udGV4dCgnSW9UVHdpbk1ha2VyU2l0ZVdpc2VJbXBvcnRlckhhbmRsZXInKSxcbiAgICAgICAgICAgIG1lbW9yeVNpemU6IDI1NixcbiAgICAgICAgICAgIHJvbGU6IGlvdHR3aW5tYWtlcl9jb25uZWN0b3Jfcm9sZSxcbiAgICAgICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLlBZVEhPTl8zXzksXG4gICAgICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcygxNSksXG4gICAgICAgICAgICBsYXllcnM6IFtpb3R0d2lubWFrZXJfZW52XSxcbiAgICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICAgICAgJ0FXU19FTkRQT0lOVCc6IHRoaXMubm9kZS50cnlHZXRDb250ZXh0KCdBV1NBUElFbmRwb2ludCcpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBzaXRld2lzZV9leHBvcnRfdGFzayA9IG5ldyB0YXNrcy5MYW1iZGFJbnZva2UodGhpcywgJ3NpdGV3aXNlX2V4cG9ydCcsIHtcbiAgICAgICAgICAgIGxhbWJkYUZ1bmN0aW9uOiBzaXRld2lzZV9leHBvcnRlcl9sYW1iZGEsXG4gICAgICAgICAgICBvdXRwdXRQYXRoOiAnJC5QYXlsb2FkJ1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgc2l0ZXdpc2VfaW1wb3J0X3Rhc2sgPSBuZXcgdGFza3MuTGFtYmRhSW52b2tlKHRoaXMsICdzaXRld2lzZV9pbXBvcnQnLCB7XG4gICAgICAgICAgICBsYW1iZGFGdW5jdGlvbjogaW90dHdpbm1ha2VyX3NpdGV3aXNlX2ltcG9ydGVyXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBzaXRld2lzZV9zZm5fZGVmbiA9IHNpdGV3aXNlX2V4cG9ydF90YXNrLm5leHQoc2l0ZXdpc2VfaW1wb3J0X3Rhc2spO1xuICAgICAgICBjb25zdCBzaXRld2lzZV9zZm4gPSBuZXcgc2ZuLlN0YXRlTWFjaGluZSh0aGlzLCAnc2l0ZXdpc2VfdG9faW90dHdpbm1ha2VyJywge1xuICAgICAgICAgICAgZGVmaW5pdGlvbjogc2l0ZXdpc2Vfc2ZuX2RlZm5cbiAgICAgICAgfSk7XG5cbiAgICB9XG59XG4iXX0=