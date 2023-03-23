import CloudFormation, { Stack, StackStatus, StackSummary } from 'aws-sdk/clients/cloudformation'
import { timeoutAsync } from './timeout-async'

const COMPLETED_STATI: StackStatus[] = [
  'CREATE_COMPLETE',
  'UPDATE_COMPLETE',
  'ROLLBACK_COMPLETE',
  'UPDATE_ROLLBACK_COMPLETE',
  'IMPORT_COMPLETE',
]

export class StackHelper {
  private readonly cfn: CloudFormation

  constructor(cfn?: CloudFormation) {
    this.cfn = cfn || new CloudFormation()
  }

  async listAllStacks(stackNamePrefix: string, statusFilter: StackStatus[] = COMPLETED_STATI): Promise<StackSummary[]> {
    const stacks: StackSummary[] = []
    let nextToken: string | undefined = undefined
    do {
      const stackListResponse = await this.cfn
        .listStacks({
          NextToken: nextToken,
          StackStatusFilter: statusFilter,
        })
        .promise()

      const matchingStacks = stackListResponse.StackSummaries.filter((s) => s.StackName.startsWith(stackNamePrefix))
      stacks.push(...matchingStacks)

      nextToken = stackListResponse.NextToken
    } while (nextToken)

    return stacks
  }

  async deleteStacks(stackNames: string[], waitForDeleteComplete: boolean = false): Promise<void> {
    if (stackNames.length === 0) {
      return
    }
    console.log('delete stacks:', stackNames)
    console.log('waitForDeleteComplete:', waitForDeleteComplete)
    await Promise.all(stackNames.map((s) => this.deleteStack(s, waitForDeleteComplete)))
  }

  deleteStack(stackName: string, waitForDeleteComplete = false) {
    return this.cfn
      .deleteStack({ StackName: stackName })
      .promise()
      .then(() => (waitForDeleteComplete ? this.waitForDeleteComplete(stackName) : true))
  }

  describeStack(stackName: string): Promise<Stack | null> {
    // throws if stack does no longer exist -- with listStacks we could get the actual 'DELETE_COMPLETE' status of it
    return this.cfn
      .describeStacks({ StackName: stackName })
      .promise()
      .then((res) => {
        const stack = res.Stacks.find((s) => s.StackName === stackName)
        return stack || null
      })
  }

  private waitForDeleteComplete(stackName: string): Promise<boolean> {
    return this.cfn
      .waitFor('stackDeleteComplete', { StackName: stackName })
      .promise()
      .then(() => true)
  }

  private getStackUpdateUntilDeleted(stackName: string, first = true): Promise<boolean> {
    return this.describeStack(stackName).then((stack) => {
      switch (stack.StackStatus) {
        case 'DELETE_COMPLETE':
          console.info(`${stack.StackName}: ${stack.StackStatus}`)
          return true

        case 'DELETE_FAILED':
          console.error(`${stack.StackName}: ${stack.StackStatus}`, stack.StackStatusReason)
          return false

        case 'DELETE_IN_PROGRESS':
          if (first) {
            console.info(`${stack.StackName}: ${stack.StackStatus}`)
          }
          return timeoutAsync(15).then(() => this.getStackUpdateUntilDeleted(stack.StackName, false))

        default:
          throw new Error(`StackStatus of ${stack.StackName} is ${stack.StackStatus} (${stack.StackStatusReason})`)
      }
    })
  }
}
