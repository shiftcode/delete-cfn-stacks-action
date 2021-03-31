import * as core from '@actions/core'
import CloudFormation from 'aws-sdk/clients/cloudformation'
import { branchToStageName } from '@shiftcode/build-helper/dist/branch.utils'

// to test locally: call index.js with env var INPUT_STACKNAMEPREFIX
// like `INPUT_STACKNAMEPREFIX="bag-covid19" node ./dist/index.js`

export async function run() {
  try {
    // reading the inputs (inputs defined in action.yml)
    const stackNamePrefix = core.getInput('stackNamePrefix')
    const stage = branchToStageName()

    console.log(`using stack name prefix ${stackNamePrefix || '_NOT_DEFINED_'}`)
    console.log(`using stack name suffix ${stage || '_NOT_DEFINED_'}`)

    const cfn = new CloudFormation()

    const stacks: CloudFormation.StackSummary[] = []
    let nextToken: string | undefined = undefined
    do {
      const stackListResponse = await cfn.listStacks({
        NextToken: nextToken,
        StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE', 'ROLLBACK_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE', 'IMPORT_COMPLETE'],
      }).promise()
      stacks.push(...stackListResponse.StackSummaries)
      nextToken = stackListResponse.NextToken
    } while (nextToken)

    const matchingStacks = stacks.filter((s) => s.StackName.startsWith(stackNamePrefix) && s.StackName.endsWith(stage))

    console.log(matchingStacks)
    // todo: delete the stacks


    // defining the outputs (outputs defined in action.yml)
    core.setOutput('deletedStacks', matchingStacks)

  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
