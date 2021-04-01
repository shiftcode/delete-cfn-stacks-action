import CloudFormation from 'aws-sdk/clients/cloudformation'

export async function fetchAllStacks(cfn: CloudFormation, stackNamePrefix: string): Promise<CloudFormation.StackSummary[]> {
  const stacks: CloudFormation.StackSummary[] = []
  let nextToken: string | undefined = undefined
  do {
    const stackListResponse = await cfn.listStacks({
      NextToken: nextToken,
      StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE', 'ROLLBACK_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE', 'IMPORT_COMPLETE'],
    }).promise()
    const matchingStacks = stackListResponse.StackSummaries
      .filter((s) => s.StackName.startsWith(stackNamePrefix))
    stacks.push(...matchingStacks)
    nextToken = stackListResponse.NextToken
  } while (nextToken)

  return stacks
}
