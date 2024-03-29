# Delete CloudFormation stacks action
![version](https://img.shields.io/github/last-commit/shiftcode/delete-cfn-stacks-action)
![version](https://img.shields.io/github/tag/shiftcode/delete-cfn-stacks-action?label=version)


This action deletes all cloudformation xx/pr stacks in the provided region with the given name prefix + the stage suffix. 
The stage is transformed from the branch name (eg. `#85-my-feature` > `xx85` / `pr85`). Production branch (`master` | `main`) branch 
is always ignored.

Make sure your CloudFormation Stacks are fully deletable (if autoDeleteBuckets=true also autoDeleteItems, etc.)

## Usage
### Inputs

#### `stackNamePrefix`
**Required** `string` The prefix of the stack names to delete.

#### `waitForDeleteComplete`
**Optional** `boolean` Whether the action should wait until the stack is completely deleted (status=`DELETE_COMPLETE`).

#### `ignoreBranches`
**Optional** `JSON String Array` branches to ignore (early exit, necessary since on-delete workflows do not support branch restrictions). 
Production branches (`master` | `main`) branch is always ignored.


### Example workflow step config
```
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: 'arn:aws:iam::{ACCOUNT_ID}:role/{ROLE_NAME}'
    aws-region: eu-central-1
- name: Delete Stacks
  uses: shiftcode/delete-cfn-stacks-action@v0.0.X
  with:
    stackNamePrefix: 'ch-website'
    waitForDeleteComplete: true
    # master & main are ignored by default
    ignoreBranches: '["#1-dev"]'
```
### Hints
- If there are stacks in multiple regions: use both actions two times with their corresponding region.
- If working with `assumedRoles` and [`aws-actions/configure-aws-credentials@v1`](https://github.com/aws-actions/configure-aws-credentials) the policy statement for the static iam user needs to have the actions `"sts:AssumeRole` AND `sts:TagSession` allowed on the role to assume. 
The Trust relationship of the assumed role needs to allow those actions for the assuming user. 

## Development
### testing
To test the action locally: call `index.js` with env var `INPUT_STACKNAMEPREFIX`
--> `INPUT_STACKNAMEPREFIX="bag-covid19" node ./dist/index.js`
### new version
1) implement your changes
2) commit with `npx commit`
3) set tag `git tag -a -m "my fancy release" v0.0.X`
4) push with tags `git push --follow-tags`
