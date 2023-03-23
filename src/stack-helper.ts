import * as core from '@actions/core'
import {setTimeout} from 'node:timers/promises'
import {
    CloudFormation,
    Stack,
    StackStatus,
    StackSummary,
} from "@aws-sdk/client-cloudformation";
import {
    waitUntilStackDeleteComplete
} from "@aws-sdk/client-cloudformation/dist-types/waiters/waitForStackDeleteComplete.js";

const COMPLETED_STATI: StackStatus[] = [
    StackStatus.CREATE_COMPLETE,
    StackStatus.UPDATE_COMPLETE,
    StackStatus.ROLLBACK_COMPLETE,
    StackStatus.UPDATE_ROLLBACK_COMPLETE,
    StackStatus.IMPORT_COMPLETE,
]

const MAX_WAIT_TIME_SEC = 10 * 60 // 10 minutes 

export class StackHelper {
    private readonly cfn: CloudFormation

    constructor(cfn?: CloudFormation) {
        this.cfn = cfn || new CloudFormation({})
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
        
        core.info(`delete stacks: ${stackNames}`)
        core.info(`waitForDeleteComplete: ${waitForDeleteComplete}`)
        await Promise.all(stackNames.map((s) => this.deleteStack(s, waitForDeleteComplete)))
    }

    async deleteStack(stackName: string, waitForDeleteComplete = false) {
        await this.cfn.deleteStack({StackName: stackName})
        if (waitForDeleteComplete) {
            await waitUntilStackDeleteComplete({client: this.cfn, maxWaitTime: MAX_WAIT_TIME_SEC}, {StackName: stackName})
        }
    }

    async describeStack(stackName: string): Promise<Stack | undefined> {
        // throws if stack does no longer exist -- with listStacks we could get the actual 'DELETE_COMPLETE' status of it
        const stack = await this.cfn
            .describeStacks({StackName: stackName})
        return stack.Stacks.find((s) => s.StackName === stackName)
    }

    // the value is used
    // @ts-ignore
    private async getStackUpdateUntilDeleted(stackName: string, first = true): Promise<boolean> {
        const stack = await this.describeStack(stackName)
        switch (stack?.StackStatus) {
            case 'DELETE_COMPLETE':
                core.info(`${stack.StackName}: ${stack.StackStatus}`)
                return true
            case 'DELETE_FAILED':
                core.error(`${stack.StackName}: ${stack.StackStatus} (reason: ${stack.StackStatusReason})`)
                return false
            case 'DELETE_IN_PROGRESS':
                if (first) {
                    core.info(`${stack.StackName}: ${stack.StackStatus}`)
                }
                await setTimeout(15)
                return this.getStackUpdateUntilDeleted(stack.StackName, false)
            default:
                throw new Error(`StackStatus of ${stack.StackName} is ${stack.StackStatus} (${stack.StackStatusReason})`)
        }
    }
}