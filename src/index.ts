import * as core from '@actions/core'
import * as github from '@actions/github'
import CloudFormation from 'aws-sdk/clients/cloudformation'
import { branchToStageName } from '@shiftcode/build-helper/branch.utils'
import { fetchAllStacks } from './fetch-all-stacks.function'

export async function run() {
  try {
    console.debug('github', github.context)
    // reading the inputs (inputs defined in action.yml)
    const stackNamePrefix = core.getInput('stackNamePrefix')
    const stage = branchToStageName(github.context.payload.ref.replace(/^(.+\/)?/, ''))

    console.log(`provided stack name prefix: ${stackNamePrefix || '_NOT_DEFINED_'}`)
    console.log(`stage as stack name suffix: ${stage || '_NOT_DEFINED_'}`)

    const cfn = new CloudFormation()

    const stacks = await fetchAllStacks(cfn, stackNamePrefix, stage)
    const stackNames = stacks.map((s) => s.StackName)

    if (stacks.length === 0) {
      console.info('No Stacks to delete')
    } else {
      console.log('Stacks to delete:', stackNames)
      // todo: delete the stacks
    }

    // defining the outputs (outputs defined in action.yml)
    core.setOutput('deletedStacks', stackNames)

  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
