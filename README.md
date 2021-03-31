# Delete CloudFormation stacks action

This action deletes all cloudformation stacks in the provided region with the given name prefix + the stage suffix

## Inputs

### `stackNamePrefix`
**Required** The prefix of the stack names to delete.

## Example workflow step config
```
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v1
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: eu-central-1
- name: Delete Stacks
  uses: shiftcode/delete-cfn-stack-action@v1
  with:
    stack-name-prefix: 'bag-covid19-'
```
