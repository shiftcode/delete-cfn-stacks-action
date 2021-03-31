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
    role-to-assume: 'arn:aws:iam::411802732539:role/ScAccess'
    aws-region: eu-central-1
- name: Delete Stacks
  uses: shiftcode/delete-cfn-stacks-action@v0.0.1
  with:
    stackNamePrefix: 'bag-covid19-'
```
**hint:** if working with `assumedRoles` and [`aws-actions/configure-aws-credentials@v1`](https://github.com/aws-actions/configure-aws-credentials) the policy statement for the static iam user needs to have `"sts:AssumeRole` AND `sts:TagSession` on the role to assume.

## dev
1) edit
2) commit
3) set tag `git tag -a -m "my fancy release" v0.0.1`
4) push with tags `git push --follow-tags`
