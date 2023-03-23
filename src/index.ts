import * as core from '@actions/core'
import * as github from '@actions/github'
import { StackHelper } from './stack-helper'
import { isMasterBranch, parseBranchName } from '@shiftcode/branch-utilities'

export async function run() {
  try {
    console.debug('github', github.context)
    // reading the inputs (inputs defined in action.yml)
    const waitForDeleteComplete = core.getInput('waitForDeleteComplete', { required: true }) === 'true'
    const stackNamePrefix = core.getInput('stackNamePrefix', { required: true })
    const ignoreBranches: string[] = JSON.parse(core.getInput('ignoreBranches', { required: true }))

    if (!Array.isArray(ignoreBranches)) {
      throw new Error(
        `action input 'ignoreBranches' needs to be a json array. provided value '${core.getInput(
          'ignoreBranches',
        )}' could not be parsed`,
      )
    }

    const ref = github.context.payload.ref

    if (isMasterBranch(ref)) {
      console.info(`detected master branch -- cancel action`)
      core.setOutput('deletedStacks', [])
      return
    }
    if (ignoreBranches.includes(ref)) {
      console.info(`branch '${github.context.payload.ref}' was defined to ignore.`)
      console.info(`cancel action`)
      core.setOutput('deletedStacks', [])
      return
    }

    const branch = parseBranchName(ref.replace(/^(.+\/)?/, ''))
    const xxSuffix = `xx${branch.branchId}`
    const prSuffix = `pr${branch.branchId}`

    console.log(`provided stack name prefix: ${stackNamePrefix}`)
    console.log(`stage as stack name suffix: ${xxSuffix}|${prSuffix}`)

    const stackHelper = new StackHelper()

    const stacks = (await stackHelper.listAllStacks(stackNamePrefix)).map((s) => s.StackName)

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
