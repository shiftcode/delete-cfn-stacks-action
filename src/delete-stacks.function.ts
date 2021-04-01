import CloudFormation from 'aws-sdk/clients/cloudformation'


export async function deleteStacks(cfn: CloudFormation, stacksToDelete: CloudFormation.StackSummary[]): Promise<void> {
  if (stacksToDelete.length === 0) {
    return
  }
  console.log('delete stacks:', stacksToDelete.map((s) => s.StackName))
  await Promise.all(
    stacksToDelete.map(({ StackName }) => cfn.deleteStack({ StackName }).promise()),
  )
}
