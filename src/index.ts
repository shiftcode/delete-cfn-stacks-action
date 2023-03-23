import * as core from '@actions/core'
import * as github from '@actions/github'
import { StackHelper } from './stack-helper.js'
import { isMasterBranch, parseBranchName } from '@shiftcode/branch-utilities'

export async function run() {
  try {
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

    // TODO does the payload.ref exists?
    core.info(`#### check here (github.context.payload.ref): ${github.context.payload.ref}`)
    const ref = github.context.payload.ref

    if (isMasterBranch(ref)) {
      core.info(`detected master branch -- cancel action`)
      core.setOutput('deletedStacks', [])
      return
    }
    
    if (ignoreBranches.includes(ref)) {
      core.info(`branch '${github.context.payload.ref}' was defined to ignore.`)
      core.info(`cancel action`)
      core.setOutput('deletedStacks', [])
      return
    }

    const branch = parseBranchName(ref.replace(/^(.+\/)?/, ''))
    const xxSuffix = `xx${branch.branchId}`
    const prSuffix = `pr${branch.branchId}`

    core.info(`provided stack name prefix: ${stackNamePrefix}`)
    core.info(`stage as stack name suffix: ${xxSuffix}|${prSuffix}`)

    const stackHelper = new StackHelper()

    const stacks = (await stackHelper.listAllStacks(stackNamePrefix)).map((s) => s.StackName)

    const xxStacks = stacks.filter((stackName) => stackName.endsWith(xxSuffix))
    const prStacks = stacks.filter((stackName) => stackName.endsWith(prSuffix))

    if (!xxStacks.length && !prStacks.length) {
      core.info('No Stacks to delete')
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
