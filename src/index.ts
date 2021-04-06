import * as core from '@actions/core'
import * as github from '@actions/github'
import { parseBranchName } from '@shiftcode/build-helper/branch.utils'
import { StackHelper } from './stack-helper'

export async function run() {
  try {
    console.debug('github', github.context)
    // reading the inputs (inputs defined in action.yml)
    const waitForDeleteComplete = core.getInput('waitForDeleteComplete', { required: true }) === 'true'
    const stackNamePrefix = core.getInput('stackNamePrefix', { required: true })
    const branchName = parseBranchName(github.context.payload.ref.replace(/^(.+\/)?/, ''))
    const xxSuffix = `xx${branchName.branchId}`
    const prSuffix = `pr${branchName.branchId}`

    console.log(`provided stack name prefix: ${stackNamePrefix}`)
    console.log(`stage as stack name suffix: ${xxSuffix}|${prSuffix}`)

    const stackHelper = new StackHelper()

    const stacks = (await stackHelper.listAllStacks(stackNamePrefix))
      .map((s) => s.StackName)

    const xxStacks = stacks.filter((stackName) => stackName.endsWith(xxSuffix))
    const prStacks = stacks.filter((stackName) => stackName.endsWith(prSuffix))

    if (!xxStacks.length && !prStacks.length) {
      console.info('No Stacks to delete')
    } else {
      await Promise.all([
        stackHelper.deleteStacks(xxStacks, waitForDeleteComplete),
        stackHelper.deleteStacks(prStacks, waitForDeleteComplete),
      ])
    }

    // defining the outputs (outputs defined in action.yml)
    core.setOutput('deletedStacks', [...xxStacks, ...prStacks])
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
