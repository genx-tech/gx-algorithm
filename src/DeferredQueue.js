/**
 * id, job, dueAt, status, batchId (default '*'), dispatchedAt, lockFlag
 * uniqueKeys: [ job, batchId ]
 *
 */
const timestampOffset = 1640995200000;

class DeferredQueue {
    constructor(app, storageModel, processTimeout) {
        this.app = app;
        this.storage = this.app.model(storageModel);
        this.processTimeout = processTimeout || 600000;
    }

    genreateBatchId() {
        return (Date.now() - timestampOffset).toString();
    }

    async postJobRequest_(job, deferedTime) {
        const now = this.app.now();
        const due = now.plus({ milliseconds: deferedTime || 3000 });

        const queuedJob = await this.storage.create_(
            {
                job: JSON.stringify(job),
                dueAt: due,
                batchId: '*',
            },
            null,
            {
                insertIgnore: true,
            }
        );

        return queuedJob;
    }

    async popExpiredRequests_() {
        const expired = this.app
            .now()
            .minus({ milliseconds: this.processTimeout });

        const deleteOptions = {
            $query: {
                batchId: { $neq: '*' },
                dispatchedAt: { $lte: expired },
                lockerId: { $exists: false },
            },
            $retrieveDbResult: true,
        };

        await this.remove_(deleteOptions);

        return deleteOptions.$result.affectedRows;
    }

    async processDueRequests_() {
        const now = this.app.now();
        const batchId = this.genreateBatchId();

        const updated = await this.storage.updateMany_(
            {
                batchId,
                dispatchedAt: now,
            },
            {
                $query: {
                    batchId: '*',
                    dueAt: { $lte: now },
                },
                $retrieveUpdated: {
                    $query: {
                        batchId,
                    },
                },
            }
        );

        return updated;
    }

    async remove_(conditon) {
        await this.storage.deleteMany_(conditon);
    }

    async removeById_(id) {
        await this.storage.deleteOne_(id);
    }

    async clearQueue_() {
        await this.storage.deleteAll_();
    }

    async getBatchStatus_() {
        const batchStats = await this.storage.findAll_({
            $projection: [
                'batchId',
                this.storage.db.connector.queryCount(null, 'batchId'),
            ],
            $query: {
                lockerId: { $exists: false },
            },
            $groupBy: ['batchId'],
            $skipOrm: true,
        });

        let pending = 0;
        let processing = 0;
        const batches = {};

        batchStats.forEach((batch) => {
            if (batch[0] === '*') {
                pending = batch[1];
            } else {
                batches[batch[0]] = batch[1];
                processing += batch[1];
            }
        });

        return {
            numPending: pending,
            numProcessing: processing,
            batches,
        };
    }
}

module.exports = DeferredQueue;
