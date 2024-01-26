import * as core from '@actions/core'
import * as github from '@actions/github'
import {StackHelper} from './stack-helper.js'
import {isMainBranch, isMasterBranch, parseBranchName} from '@shiftcode/branch-utilities'

try {
    // reading the inputs (inputs defined in action.yml)
    const waitForDeleteComplete = core.getInput('waitForDeleteComplete', {required: true}) === 'true'
    const stackNamePrefix = core.getInput('stackNamePrefix', {required: true})
    const ignoreBranches: string[] = JSON.parse(core.getInput('ignoreBranches', {required: true}))

    if (!Array.isArray(ignoreBranches)) {
        throw new Error(
            `action input 'ignoreBranches' needs to be a json array. provided value '${core.getInput(
                'ignoreBranches',
            )}' could not be parsed`,
        )
    }

    // this is defined, although the payload.ref is not typed, it contains the branch name
    const branchName = github.context.payload.ref

    if (isMasterBranch(branchName) || isMainBranch(branchName)) {
        core.notice(`detected master branch --> stopping here`)
    }else if (ignoreBranches.includes(branchName)) {
        core.notice(`branch '${github.context.payload.ref}' was defined to ignore --> stopping here`)
    }else {
        const branch = parseBranchName(branchName.replace(/^(.+\/)?/, ''))
        const xxSuffix = `xx${branch.branchId}`
        const prSuffix = `pr${branch.branchId}`

        core.info(`stack name  ${stackNamePrefix}-(${xxSuffix}|${prSuffix})`)

        const stackHelper = new StackHelper()

        const stacks = (await stackHelper.listAllStacks(stackNamePrefix)).map((s) => s.StackName)

        const xxStacks = stacks.filter((stackName) => stackName.endsWith(xxSuffix))
        const prStacks = stacks.filter((stackName) => stackName.endsWith(prSuffix))

        if (!xxStacks.length && !prStacks.length) {
            core.notice('No Stacks to delete')
        } else {
            await Promise.allSettled([
                stackHelper.deleteStacks(xxStacks, waitForDeleteComplete),
                stackHelper.deleteStacks(prStacks, waitForDeleteComplete),
            ])
            core.notice(`deleted stacks: ${[...xxStacks, ...prStacks].join(', ')} (waitForDeleteComplete: ${waitForDeleteComplete})`)
        }
    }
} catch (error) {
    core.setFailed(error.message)
}