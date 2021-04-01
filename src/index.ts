import * as core from '@actions/core'
import * as github from '@actions/github'
import { parseBranchName } from '@shiftcode/build-helper/branch.utils'
import CloudFormation from 'aws-sdk/clients/cloudformation'
import { deleteStacks } from './delete-stacks.function'
import { fetchAllStacks } from './fetch-all-stacks.function'

export async function run() {
  try {
    console.debug('github', github.context)
    // reading the inputs (inputs defined in action.yml)
    const stackNamePrefix = core.getInput('stackNamePrefix')
    const branchName = parseBranchName(github.context.payload.ref.replace(/^(.+\/)?/, ''))
    const xxSuffix = `xx${branchName.branchId}`
    const prSuffix = `pr${branchName.branchId}`

    console.log(`provided stack name prefix: ${stackNamePrefix}`)
    console.log(`stage as stack name suffix: ${xxSuffix}|${prSuffix}`)

    const cfn = new CloudFormation()

    const stacks = await fetchAllStacks(cfn, stackNamePrefix)
    const xxStacks = stacks.filter((s) => s.StackName.endsWith(xxSuffix))
    const prStacks = stacks.filter((s) => s.StackName.endsWith(prSuffix))

    if (!xxStacks.length && !prStacks.length) {
      console.info('No Stacks to delete')
    } else {
      await Promise.all([
        deleteStacks(cfn, xxStacks),
        deleteStacks(cfn, prStacks)
      ])
    }

    // defining the outputs (outputs defined in action.yml)
    core.setOutput('deletedStacks', [...xxStacks, ...prStacks])
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
